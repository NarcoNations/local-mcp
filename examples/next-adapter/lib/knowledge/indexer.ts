import { unzip } from 'unzipit';
import type { SupabaseClient } from '@supabase/supabase-js';
import { sbServer } from '@/examples/next-adapter/lib/supabase/server';
import { embedText } from '@/examples/next-adapter/lib/embeddings/model';
import { chunkText } from '@/examples/next-adapter/lib/embeddings/chunker';
import { logEvent } from '@/examples/next-adapter/lib/historian';

type KnowledgeRow = {
  id: string;
  slug: string;
  title?: string | null;
  manifest_path: string | null;
  meta?: any;
};

type ManifestFile = {
  path: string;
  size?: number;
  content_type?: string | null;
};

type Manifest = {
  slug: string;
  title: string;
  sha256?: string;
  created_at?: string;
  files: ManifestFile[];
  archive_path?: string;
};

type IndexInput = {
  knowledgeId?: string;
  slug?: string;
  emitEvent?: boolean;
  source?: string;
};

export async function indexKnowledge(input: IndexInput) {
  if (!input.knowledgeId && !input.slug) {
    throw new Error('knowledgeId or slug is required');
  }
  const started = Date.now();
  const bucket = process.env.SUPABASE_BUCKET_FILES || 'files';
  const sb = sbServer();

  const knowledge = await fetchKnowledge(sb, input);
  if (!knowledge.manifest_path) throw new Error('knowledge manifest missing');

  const manifest = await readManifest(sb, bucket, knowledge.manifest_path);
  const archivePath = manifest.archive_path || knowledge.meta?.archive_path || `archives/${knowledge.slug}.zip`;
  const archiveBuf = await downloadArchive(sb, bucket, archivePath);
  const { entries } = await unzip(archiveBuf);
  const decoder = new TextDecoder();

  const chunks: {
    knowledge_id: string;
    chunk_ix: number;
    content: string;
    embedding: number[];
  }[] = [];
  const details: { chunk_ix: number; path: string; preview: string }[] = [];
  let ix = 0;

  for (const file of manifest.files || []) {
    const entry = (entries as any)[file.path];
    if (!entry || !shouldIndex(file)) continue;
    const buf = await entry.arrayBuffer();
    const text = decoder.decode(buf).trim();
    if (!text) continue;
    const parts = chunkText(text, { chunkSize: 700, overlap: 150 });
    for (const part of parts) {
      if (!part.trim()) continue;
      const embedding = await embedText(part);
      chunks.push({ knowledge_id: knowledge.id, chunk_ix: ix, content: part, embedding });
      details.push({ chunk_ix: ix, path: file.path, preview: part.slice(0, 160) });
      ix++;
    }
  }

  await sb.from('embeddings').delete().eq('knowledge_id', knowledge.id);
  for (let i = 0; i < chunks.length; i += 50) {
    const batch = chunks.slice(i, i + 50);
    if (batch.length) {
      const { error } = await sb.from('embeddings').insert(batch);
      if (error) throw error;
    }
  }

  const summary = {
    knowledgeId: knowledge.id,
    slug: knowledge.slug,
    chunks: chunks.length,
    files: manifest.files?.length || 0,
    duration_ms: Date.now() - started
  };

  if (input.emitEvent !== false) {
    await logEvent({
      source: input.source || 'knowledge',
      kind: 'knowledge.index',
      title: `Indexed ${knowledge.slug}`,
      meta: { ...summary }
    });
  }

  return { ...summary, details };
}

async function fetchKnowledge(sb: SupabaseClient, input: IndexInput): Promise<KnowledgeRow> {
  const query = sb
    .from('knowledge')
    .select('id, slug, title, manifest_path, meta')
    .limit(1);
  if (input.knowledgeId) {
    query.eq('id', input.knowledgeId);
  } else if (input.slug) {
    query.eq('slug', input.slug);
  }
  const { data, error } = await query.single();
  if (error) throw error;
  if (!data) throw new Error('knowledge not found');
  return data as KnowledgeRow;
}

async function readManifest(sb: SupabaseClient, bucket: string, path: string): Promise<Manifest> {
  const { data, error } = await sb.storage.from(bucket).download(path);
  if (error || !data) throw new Error('failed to download manifest');
  const json = JSON.parse(await data.text());
  return json as Manifest;
}

async function downloadArchive(sb: SupabaseClient, bucket: string, path: string) {
  const { data, error } = await sb.storage.from(bucket).download(path);
  if (error || !data) throw new Error('failed to download archive');
  return data.arrayBuffer();
}

function shouldIndex(file: ManifestFile) {
  const path = file.path.toLowerCase();
  if (file.content_type && file.content_type.startsWith('text/')) return true;
  return path.endsWith('.md') || path.endsWith('.markdown') || path.endsWith('.txt');
}
