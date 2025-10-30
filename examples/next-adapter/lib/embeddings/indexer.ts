import { unzip } from 'unzipit';
import type { SupabaseClient } from '@supabase/supabase-js';
import { sbServer } from '../supabase/server';

const MODEL_ID = 'Xenova/all-MiniLM-L6-v2';
const TARGET_TOKENS = 700;
const OVERLAP_TOKENS = 150;

type KnowledgeRow = {
  id: string;
  slug: string;
  title?: string | null;
  manifest_path?: string | null;
};

type ChunkMeta = {
  chunk_ix: number;
  path: string;
  content: string;
};

type IndexOptions = {
  knowledgeId?: string;
  slug?: string;
};

export type IndexResult = {
  knowledgeId: string;
  slug: string;
  chunks: ChunkMeta[];
};

export async function runEmbeddingJob(options: IndexOptions): Promise<IndexResult> {
  if (!options.knowledgeId && !options.slug) {
    throw new Error('Provide --knowledge_id or --slug');
  }
  const supabase = sbServer();
  const knowledge = await resolveKnowledge(supabase, options);
  const bucket = process.env.SUPABASE_BUCKET_FILES || 'files';
  const zipKey = `archives/${knowledge.slug}.zip`;
  const { data: archiveBlob, error: archiveErr } = await supabase.storage.from(bucket).download(zipKey);
  if (archiveErr || !archiveBlob) {
    throw new Error(`Download failed for ${zipKey}: ${archiveErr?.message || 'missing blob'}`);
  }
  const archiveBuffer = await archiveBlob.arrayBuffer();
  const { entries } = await unzip(archiveBuffer);

  const documents: { path: string; text: string }[] = [];
  for (const name of Object.keys(entries)) {
    const entry: any = (entries as any)[name];
    if (!entry || entry.isDirectory || name.endsWith('/')) continue;
    if (!shouldEmbedFile(name)) continue;
    const text = await entry.text();
    const trimmed = typeof text === 'string' ? text.trim() : String(text).trim();
    if (!trimmed) continue;
    documents.push({ path: name, text: trimmed });
  }

  await supabase.from('embeddings').delete().eq('knowledge_id', knowledge.id);
  if (!documents.length) {
    return { knowledgeId: knowledge.id, slug: knowledge.slug, chunks: [] };
  }

  const embedder = await loadEmbedder();
  const tokenizer = await loadTokenizer();

  let chunkIx = 0;
  const buffer: any[] = [];
  const chunks: ChunkMeta[] = [];

  async function flushBuffer() {
    if (!buffer.length) return;
    const payload = buffer.splice(0, buffer.length);
    const { error } = await supabase.from('embeddings').insert(payload);
    if (error) throw error;
  }

  for (const doc of documents) {
    const segments = await chunkDocument(doc.text, tokenizer, TARGET_TOKENS, OVERLAP_TOKENS);
    for (const segment of segments) {
      const vector = await embedText(embedder, segment);
      buffer.push({ knowledge_id: knowledge.id, chunk_ix: chunkIx, content: segment, embedding: vector });
      chunks.push({ chunk_ix: chunkIx, path: doc.path, content: segment });
      chunkIx++;
      if (buffer.length >= 50) await flushBuffer();
    }
  }

  await flushBuffer();
  return { knowledgeId: knowledge.id, slug: knowledge.slug, chunks };
}

async function resolveKnowledge(supabase: SupabaseClient, options: IndexOptions): Promise<KnowledgeRow> {
  const query = supabase.from('knowledge').select('id, slug, title, manifest_path');
  if (options.knowledgeId) {
    const { data, error } = await query.eq('id', options.knowledgeId).maybeSingle();
    if (error) throw error;
    if (!data) throw new Error(`Knowledge id ${options.knowledgeId} not found`);
    return data as KnowledgeRow;
  }
  const { data, error } = await query.eq('slug', options.slug!).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(`Knowledge slug ${options.slug} not found`);
  return data as KnowledgeRow;
}

function shouldEmbedFile(path: string) {
  const lower = path.toLowerCase();
  return lower.endsWith('.md') || lower.endsWith('.markdown') || lower.endsWith('.txt') || lower.endsWith('.mdx');
}

export async function loadEmbedder() {
  try {
    const { pipeline } = await import('@xenova/transformers');
    return pipeline('feature-extraction', MODEL_ID, { quantized: false });
  } catch (err: any) {
    throw new Error(`Failed to load embeddings model (${MODEL_ID}): ${err?.message || err}`);
  }
}

async function loadTokenizer() {
  try {
    const { AutoTokenizer } = await import('@xenova/transformers');
    return AutoTokenizer.from_pretrained(MODEL_ID);
  } catch (err: any) {
    throw new Error(`Failed to load tokenizer (${MODEL_ID}): ${err?.message || err}`);
  }
}

async function chunkDocument(
  text: string,
  tokenizer: any,
  targetTokens: number,
  overlapTokens: number
): Promise<string[]> {
  const encoded = await tokenizer.encode(text, { add_special_tokens: false });
  const ids: number[] = Array.from(encoded?.data || encoded || []);
  if (!ids.length) return [];
  const chunks: string[] = [];
  let start = 0;
  while (start < ids.length) {
    const end = Math.min(start + targetTokens, ids.length);
    const slice = ids.slice(start, end);
    let segment = await tokenizer.decode(slice, { skip_special_tokens: true });
    if (typeof segment !== 'string') segment = String(segment);
    const trimmed = segment.trim();
    if (trimmed) chunks.push(trimmed);
    if (end >= ids.length) break;
    const nextStart = end - overlapTokens;
    start = nextStart > start ? nextStart : end;
  }
  return chunks;
}

async function embedText(embedder: any, text: string): Promise<number[]> {
  const output = await embedder(text, { pooling: 'mean', normalize: true });
  const data = output?.data ?? output;
  return Array.from(data);
}
