export const runtime = 'nodejs';
import { NextRequest } from 'next/server';
import { embedText } from '@/examples/next-adapter/lib/embeddings/model';
import { sbServer } from '@/examples/next-adapter/lib/supabase/server';
import { logEvent } from '@/examples/next-adapter/lib/historian';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const q = typeof body?.q === 'string' ? body.q.trim() : '';
    const k = typeof body?.k === 'number' ? body.k : undefined;
    if (!q) return new Response('q is required', { status: 400 });
    const limit = Math.min(50, Math.max(1, k ?? 12));

    const queryEmbedding = await embedText(q);
    const sb = sbServer();
    const { data, error } = await sb
      .from('embeddings')
      .select('knowledge_id, chunk_ix, content, embedding, knowledge:knowledge_id (slug, title)')
      .limit(5000);
    if (error) throw error;
    const rows = data || [];

    const scored = rows
      .map((row: any) => {
        const vector = toArray(row.embedding);
        if (!vector.length) return null;
        const score = cosineSimilarity(queryEmbedding, vector);
        const info = row.knowledge as any;
        return {
          knowledge_id: row.knowledge_id,
          slug: info?.slug || null,
          title: info?.title || null,
          chunk_ix: row.chunk_ix,
          content: row.content,
          score
        };
      })
      .filter(Boolean) as {
        knowledge_id: string;
        slug: string | null;
        title: string | null;
        chunk_ix: number;
        content: string;
        score: number;
      }[];

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, limit);

    await logEvent({
      source: 'search',
      kind: 'search.query',
      title: 'Search executed',
      meta: { q: q.slice(0, 120), k: limit, results: top.length }
    });

    return Response.json({ ok: true, results: top });
  } catch (e: any) {
    await logEvent({ source: 'search', kind: 'error', title: 'search failed', body: e?.message || 'unknown' });
    return new Response('Error: ' + (e?.message || 'unknown'), { status: 500 });
  }
}

function toArray(value: any): number[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((v) => Number(v));
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map((v) => Number(v));
    } catch {}
  }
  return [];
}

function cosineSimilarity(a: number[], b: number[]) {
  const len = Math.min(a.length, b.length);
  let dot = 0;
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
  }
  const denom = norm(a) * norm(b);
  return denom ? dot / denom : 0;
}

function norm(vec: number[]) {
  let sum = 0;
  for (const v of vec) sum += v * v;
  return Math.sqrt(sum);
}
