import type { Chunk, Manifest } from '../src/types.js';
import { uuidV5FromComponents } from '../src/utils/hash.js';
import { getServiceClient } from './client.js';
import { hasSupabaseConfig, readSupabaseSettings } from './env.js';

const SOURCE_NAMESPACE = 'mcp-nn-source';

interface ChunkRow {
  id: string;
  namespace: string;
  source_id: string | null;
  path: string;
  type: Chunk['type'];
  page: number | null;
  offset_start: number | null;
  offset_end: number | null;
  text: string;
  tokens: number | null;
  tags: string[] | null;
  partial: boolean;
  mtime: number;
}

interface EmbeddingRow {
  chunk_id: string;
  namespace: string;
  embedding: number[];
}

export interface KnowledgeSnapshot {
  chunks: Chunk[];
  manifest: Manifest | null;
  embeddings: Map<string, Float32Array>;
}

function mapChunk(row: ChunkRow): Chunk {
  return {
    id: row.id,
    path: row.path,
    type: row.type,
    page: row.page ?? undefined,
    offsetStart: row.offset_start ?? undefined,
    offsetEnd: row.offset_end ?? undefined,
    text: row.text,
    tokens: row.tokens ?? undefined,
    tags: row.tags ?? undefined,
    partial: row.partial ?? undefined,
    mtime: row.mtime,
  };
}

function chunkSourceId(namespace: string, path: string): string {
  return uuidV5FromComponents(SOURCE_NAMESPACE, [namespace, path]);
}

async function fetchChunks(namespace: string): Promise<Chunk[]> {
  const client = getServiceClient() as any;
  const pageSize = 1000;
  const chunks: Chunk[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await client
      .from('knowledge_chunks')
      .select('*')
      .eq('namespace', namespace)
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`Failed to load knowledge_chunks: ${error.message}`);
    const rows = (data ?? []) as ChunkRow[];
    if (!rows.length) break;
    for (const row of rows) {
      chunks.push(mapChunk(row));
    }
    if (rows.length < pageSize) break;
  }
  return chunks;
}

async function fetchEmbeddings(namespace: string): Promise<Map<string, Float32Array>> {
  const client = getServiceClient() as any;
  const pageSize = 1000;
  const map = new Map<string, Float32Array>();
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await client
      .from('knowledge_embeddings')
      .select('*')
      .eq('namespace', namespace)
      .order('chunk_id', { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`Failed to load knowledge_embeddings: ${error.message}`);
    const rows = (data ?? []) as EmbeddingRow[];
    if (!rows.length) break;
    for (const row of rows) {
      map.set(row.chunk_id, Float32Array.from(row.embedding));
    }
    if (rows.length < pageSize) break;
  }
  return map;
}

export function supabaseKnowledgeEnabled(): boolean {
  return hasSupabaseConfig();
}

export async function loadKnowledgeSnapshot(): Promise<KnowledgeSnapshot | null> {
  const settings = readSupabaseSettings();
  if (!settings) return null;
  const client = getServiceClient(settings) as any;
  const namespace = settings.namespace;

  const manifestResult = (await client
    .from('knowledge_manifests')
    .select('manifest')
    .eq('namespace', namespace)
    .maybeSingle()) as { data: { manifest: Manifest } | null; error: { message: string; code?: string } | null };

  if (manifestResult.error && manifestResult.error.code !== 'PGRST116') {
    throw new Error(`Failed to load knowledge_manifests: ${manifestResult.error.message}`);
  }

  const chunks = await fetchChunks(namespace);
  const embeddings = await fetchEmbeddings(namespace);
  const manifest = manifestResult.data?.manifest ?? null;

  return { chunks, manifest, embeddings };
}

export async function persistKnowledgeSnapshot(chunks: Chunk[], manifest: Manifest, embeddings: Map<string, Float32Array>): Promise<void> {
  const settings = readSupabaseSettings();
  if (!settings) return;
  const client = getServiceClient(settings);
  const namespace = settings.namespace;

  const sourceRows = Object.values(manifest.files ?? {}).map((file) => ({
    id: chunkSourceId(namespace, file.path),
    namespace,
    path: file.path,
    type: file.type,
    size: file.size,
    mtime: file.mtime,
    partial: file.partial ?? false,
  }));

  const chunkRows = chunks.map((chunk) => ({
    id: chunk.id,
    namespace,
    source_id: chunkSourceId(namespace, chunk.path),
    path: chunk.path,
    type: chunk.type,
    page: chunk.page ?? null,
    offset_start: chunk.offsetStart ?? null,
    offset_end: chunk.offsetEnd ?? null,
    text: chunk.text,
    tokens: chunk.tokens ?? null,
    tags: chunk.tags ?? null,
    partial: chunk.partial ?? false,
    mtime: chunk.mtime,
  }));

  const embeddingRows = Array.from(embeddings.entries()).map(([chunkId, vector]) => ({
    chunk_id: chunkId,
    namespace,
    embedding: Array.from(vector),
  }));

  const manifestPayload = {
    namespace,
    manifest,
    updated_at: new Date().toISOString(),
  };

  const { error: deleteEmbeddingsError } = await client
    .from('knowledge_embeddings')
    .delete()
    .eq('namespace', namespace);
  if (deleteEmbeddingsError) {
    throw new Error(`Failed to reset embeddings: ${deleteEmbeddingsError.message}`);
  }

  const { error: deleteChunksError } = await client
    .from('knowledge_chunks')
    .delete()
    .eq('namespace', namespace);
  if (deleteChunksError) {
    throw new Error(`Failed to reset chunks: ${deleteChunksError.message}`);
  }

  const { error: deleteSourcesError } = await client
    .from('knowledge_sources')
    .delete()
    .eq('namespace', namespace);
  if (deleteSourcesError) {
    throw new Error(`Failed to reset sources: ${deleteSourcesError.message}`);
  }

  if (sourceRows.length) {
    const { error } = await (client.from('knowledge_sources') as any).upsert(sourceRows as any, {
      onConflict: 'id',
    });
    if (error) throw new Error(`Failed to upsert sources: ${error.message}`);
  }
  if (chunkRows.length) {
    const { error } = await (client.from('knowledge_chunks') as any).upsert(chunkRows as any, {
      onConflict: 'id',
    });
    if (error) throw new Error(`Failed to upsert chunks: ${error.message}`);
  }
  if (embeddingRows.length) {
    const { error } = await (client.from('knowledge_embeddings') as any).upsert(embeddingRows as any, {
      onConflict: 'chunk_id',
    });
    if (error) throw new Error(`Failed to upsert embeddings: ${error.message}`);
  }
  const { error: manifestError } = await client
    .from('knowledge_manifests')
    .upsert(manifestPayload as any, { onConflict: 'namespace' });
  if (manifestError) {
    throw new Error(`Failed to persist manifest: ${manifestError.message}`);
  }
}
