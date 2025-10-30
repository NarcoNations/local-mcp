export const runtime = 'nodejs';
import { NextRequest } from 'next/server';
import { sbServer } from '@/examples/next-adapter/lib/supabase/server';
import { logEvent } from '@/examples/next-adapter/lib/historian';
import { loadEmbedder } from '@/examples/next-adapter/lib/embeddings/indexer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const q = typeof body?.q === 'string' ? body.q.trim() : '';
    const kRaw = typeof body?.k === 'number' ? body.k : parseInt(body?.k, 10);
    const k = Number.isFinite(kRaw) ? Math.min(Math.max(1, kRaw), 50) : 12;
    if (!q) return new Response('q required', { status: 400 });

    const started = Date.now();
    const embedder = await loadEmbedder();
    const queryTensor = await embedder(q, { pooling: 'mean', normalize: true });
    const queryVec = toArray(queryTensor);

    const sb = sbServer();
    const { data, error } = await sb
      .from('embeddings')
      .select('knowledge_id, chunk_ix, content, embedding')
      .limit(4000);
    if (error) throw error;
    const rows = data || [];
    const scored = rows
      .map((row) => {
        const vec = toArray(row.embedding);
        return {
          knowledge_id: row.knowledge_id,
          chunk_ix: row.chunk_ix,
          content: row.content,
          score: cosineSimilarity(queryVec, vec)
        };
      })
      .filter((item) => Number.isFinite(item.score));

    scored.sort((a, b) => b.score - a.score);
    const hits = scored.slice(0, k);
    const knowledgeIds = Array.from(new Set(hits.map((h) => h.knowledge_id))).filter(Boolean);
    let knowledgeMap = new Map<string, { slug: string | null; title: string | null }>();
    if (knowledgeIds.length) {
      const { data: knowledgeRows } = await sb
        .from('knowledge')
        .select('id, slug, title')
        .in('id', knowledgeIds);
      knowledgeMap = new Map((knowledgeRows || []).map((row) => [row.id as string, { slug: row.slug, title: row.title }]));
    }

    const durationMs = Date.now() - started;
    await logEvent({
      source: 'search',
      kind: 'search.query',
      title: `Search for "${q.slice(0, 48)}${q.length > 48 ? '…' : ''}"`,
      meta: { q, k, results: hits.length, durationMs }
    });

    return Response.json({
      ok: true,
      hits: hits.map((hit) => ({
        ...hit,
        knowledge: knowledgeMap.get(hit.knowledge_id) || null
      })),
      durationMs
    });
  } catch (err: any) {
    await logEvent({ source: 'search', kind: 'error', title: 'search failed', body: err?.message });
    return new Response('Error: ' + (err?.message || 'unknown'), { status: 500 });
  }
}

function toArray(value: any): number[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(Number);
  if (value.data) return Array.from(value.data);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(Number);
    } catch {}
    const cleaned = value.trim().replace(/^[\[\(]/, '').replace(/[\]\)]$/, '');
    if (!cleaned) return [];
    return cleaned.split(',').map((n) => Number(n));
  }
  return [];
}

function cosineSimilarity(a: number[], b: number[]) {
  const len = Math.min(a.length, b.length);
  if (!len) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < len; i++) {
    const av = a[i];
    const bv = b[i];
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }
  if (!normA || !normB) return 0;
  return dot / Math.sqrt(normA * normB);
}
