import { unzip } from 'unzipit';
import { sbServer } from '@/examples/next-adapter/lib/supabase/server';
import type { IngestManifest, ManifestFile } from '@/examples/next-adapter/lib/ingest/convert';
import { embedText } from '@/examples/next-adapter/lib/embeddings/model';

const DEFAULT_BUCKET = process.env.SUPABASE_BUCKET_FILES || 'files';

export async function indexKnowledgeBySlug(slug: string) {
  const sb = sbServer();
  const { data, error } = await sb.from('knowledge').select('*').eq('slug', slug).maybeSingle();
  if (error) throw new Error('knowledge lookup failed: ' + error.message);
  if (!data) throw new Error('knowledge not found for slug');
  return indexKnowledgeRecord(data);
}

export async function indexKnowledgeById(knowledgeId: string) {
  const sb = sbServer();
  const { data, error } = await sb.from('knowledge').select('*').eq('id', knowledgeId).maybeSingle();
  if (error) throw new Error('knowledge lookup failed: ' + error.message);
  if (!data) throw new Error('knowledge not found for id');
  return indexKnowledgeRecord(data);
}

async function indexKnowledgeRecord(record: any) {
  const sb = sbServer();
  if (!record.manifest_path) throw new Error('knowledge manifest missing');

  const initialBucket = getBucket(record);
  const manifest = await loadManifest(sb, initialBucket, record.manifest_path);
  if (!Array.isArray(manifest.files)) throw new Error('manifest missing files array');
  const archiveBucket = manifest.storage?.bucket || initialBucket;
  const archivePath = manifest.storage?.archivePath || `archives/${record.slug}.zip`;
  const archiveBuf = await downloadArchive(sb, archiveBucket, archivePath);
  const { entries } = await unzip(archiveBuf);

  const textChunks: { content: string }[] = [];
  for (const file of manifest.files) {
    if (!isTextLike(file)) continue;
    const entry = (entries as any)[file.path];
    if (!entry || entry.isDirectory) continue;
    const buffer = await entry.arrayBuffer();
    const text = decodeUtf8(buffer);
    const chunks = chunkText(text);
    for (const chunk of chunks) {
      if (!chunk.trim()) continue;
      const prefixed = `File: ${file.path}\n\n${chunk}`;
      textChunks.push({ content: prefixed });
    }
  }

  const sbClient = sb;
  await sbClient.from('embeddings').delete().eq('knowledge_id', record.id);

  const rows: any[] = [];
  let ix = 0;
  for (const chunk of textChunks) {
    const embedding = await embedText(chunk.content);
    rows.push({
      knowledge_id: record.id,
      chunk_ix: ix,
      content: chunk.content,
      embedding
    });
    ix++;
    if (rows.length >= 50) {
      await sbClient.from('embeddings').insert(rows);
      rows.length = 0;
    }
  }
  if (rows.length) {
    await sbClient.from('embeddings').insert(rows);
  }

  return { knowledgeId: record.id, slug: record.slug, chunks: ix };
}

function getBucket(record: any) {
  if (record.meta && typeof record.meta === 'object' && record.meta.bucket) return record.meta.bucket;
  return DEFAULT_BUCKET;
}

async function loadManifest(sb: ReturnType<typeof sbServer>, bucket: string, manifestPath: string) {
  const { data, error } = await sb.storage.from(bucket).download(manifestPath);
  if (error || !data) throw new Error('manifest download failed: ' + (error?.message || 'unknown'));
  const text = await data.text();
  const manifest = JSON.parse(text) as IngestManifest & {
    storage?: { bucket?: string; archivePath?: string };
  };
  return manifest;
}

async function downloadArchive(sb: ReturnType<typeof sbServer>, bucket: string, archivePath: string) {
  const { data, error } = await sb.storage.from(bucket).download(archivePath);
  if (error || !data) throw new Error('archive download failed: ' + (error?.message || 'unknown'));
  return data.arrayBuffer();
}

function isTextLike(file: ManifestFile) {
  if (!file.contentType) return file.path.toLowerCase().endsWith('.md') || file.path.toLowerCase().endsWith('.txt');
  return file.contentType.startsWith('text/') || file.contentType === 'application/json';
}

function decodeUtf8(buffer: ArrayBuffer) {
  return new TextDecoder('utf-8').decode(new Uint8Array(buffer));
}

function chunkText(text: string, targetTokens = 700, overlap = 150) {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return [] as string[];
  const chunks: string[] = [];
  let start = 0;
  while (start < words.length) {
    const end = Math.min(words.length, start + targetTokens);
    const part = words.slice(start, end).join(' ');
    chunks.push(part);
    if (end === words.length) break;
    start = Math.max(0, end - overlap);
  }
  return chunks;
}
