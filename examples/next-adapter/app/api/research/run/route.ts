export const runtime = 'nodejs';
import { NextRequest } from 'next/server';
import { logEvent } from '@/examples/next-adapter/lib/historian';

export async function POST(req: NextRequest) {
  try {
    const { query, objectives } = await req.json();
    if (!query || typeof query !== 'string') {
      return new Response('query required', { status: 400 });
    }
    const summary = (objectives && typeof objectives === 'string' && objectives.trim()) || 'No objectives supplied.';
    const payload = {
      ok: true,
      facts: [
        `Fact: ${query.slice(0, 80)} — validated from previous VibeOS research notes.`,
        'Fact: Historian captures ingest + embeddings for provenance control.'
      ],
      insights: [
        'Insight: Pair local embeddings with cached API feeds for richer analysis.',
        `Insight: Objectives highlight “${summary.slice(0, 60)}”, prioritise quick wins.`
      ],
      sources: [
        { title: 'Spec-Kit Consolidated Build', url: '/docs/CONSOLIDATED_BUILD.md' },
        { title: 'Historian timeline', url: '/timeline' }
      ]
    };

    await logEvent({
      source: 'research',
      kind: 'research.run',
      title: `Research stub generated for ${query.slice(0, 64)}`,
      meta: { query, objectives: summary.slice(0, 120) }
    });

    return Response.json(payload);
  } catch (err: any) {
    await logEvent({
      source: 'research',
      kind: 'error',
      title: 'Research run failed',
      meta: { error: err?.message || 'unknown' }
    });
    return new Response(err?.message || 'Failed to run research stub', { status: 500 });
  }
}
