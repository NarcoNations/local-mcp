export const runtime = 'nodejs';
import { NextRequest } from 'next/server';
import { searchKnowledgeEmbeddings } from '@/examples/next-adapter/lib/knowledge/search';
import { logEvent } from '@/examples/next-adapter/lib/historian';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const q = typeof body.q === 'string' ? body.q : '';
    const k = body.k ? Number(body.k) : 12;
    if (!q.trim()) return new Response('q required', { status: 400 });
    const limit = Number.isFinite(k) && k > 0 ? Math.min(Math.floor(k), 50) : 12;
    const results = await searchKnowledgeEmbeddings(q, limit);
    await logEvent({
      source: 'search',
      kind: 'search.query',
      title: q.slice(0, 96),
      meta: { q, k: limit, results: results.length }
    });
    return Response.json({ ok: true, results });
  } catch (e: any) {
    await logEvent({
      source: 'search',
      kind: 'error',
      title: 'search query failed',
      body: e?.message || 'unknown'
    });
    return new Response('Error: ' + (e?.message || 'unknown'), { status: 500 });
  }
}
