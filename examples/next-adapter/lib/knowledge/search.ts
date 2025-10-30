import { sbServer } from '@/examples/next-adapter/lib/supabase/server';
import { embedText } from '@/examples/next-adapter/lib/embeddings/model';

export type SearchResult = {
  knowledge_id: string;
  slug?: string | null;
  title?: string | null;
  chunk_ix: number;
  content: string;
  score: number;
};

export async function searchKnowledgeEmbeddings(query: string, k = 12): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const queryEmbedding = await embedText(trimmed);
  const sb = sbServer();
  const { data, error } = await sb
    .from('embeddings')
    .select('knowledge_id, chunk_ix, content, embedding, knowledge:knowledge_id (slug, title)')
    .limit(2000);
  if (error) throw new Error('embeddings fetch failed: ' + error.message);
  const rows = data || [];
  const scored: SearchResult[] = [];
  for (const row of rows as any[]) {
    const emb = normalizeEmbedding(row.embedding);
    if (!emb || !emb.length) continue;
    const score = cosine(queryEmbedding, emb);
    scored.push({
      knowledge_id: row.knowledge_id,
      slug: row.knowledge?.slug ?? null,
      title: row.knowledge?.title ?? null,
      chunk_ix: row.chunk_ix,
      content: row.content,
      score
    });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}

function normalizeEmbedding(value: any): number[] | null {
  if (!value) return null;
  if (Array.isArray(value)) return value.map((v) => Number(v));
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map((v) => Number(v));
    } catch {}
  }
  return null;
}

function cosine(a: number[], b: number[]) {
  const len = Math.min(a.length, b.length);
  if (!len) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < len; i++) {
    const va = a[i];
    const vb = b[i];
    dot += va * vb;
    normA += va * va;
    normB += vb * vb;
  }
  if (!normA || !normB) return 0;
  return dot / Math.sqrt(normA * normB);
}
