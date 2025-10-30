export const runtime = 'nodejs';
import { NextRequest } from 'next/server';
import { logEvent } from '@/examples/next-adapter/lib/historian';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = typeof body?.query === 'string' ? body.query : '';
    const objectives = typeof body?.objectives === 'string' ? body.objectives : '';
    if (!query) return new Response('query is required', { status: 400 });

    const sections = buildStub(query, objectives);
    await logEvent({
      source: 'research',
      kind: 'research.run',
      title: `Research stub for ${query.slice(0, 48)}${query.length > 48 ? '…' : ''}`,
      meta: { query, objectives }
    });

    return Response.json({ ok: true, sections, durationMs: Math.floor(Math.random() * 40) + 60 });
  } catch (err: any) {
    await logEvent({ source: 'research', kind: 'error', title: 'research run failed', body: err?.message });
    return new Response('Error: ' + (err?.message || 'unknown'), { status: 500 });
  }
}

function buildStub(query: string, objectives: string) {
  const trimmedObjectives = objectives ? objectives : 'Capture actionable insights and follow-ups.';
  return {
    facts: [
      `The brief asks: ${query}.`,
      'md-convert streams uploads into Supabase Storage as archives and manifests.',
      'pgvector stores 384-dim MiniLM embeddings for cosine search.'
    ],
    insights: [
      'Automating Historian logging per pipeline step keeps the timeline audit-friendly.',
      'Expose the Workroom export in the MVP generator so lanes stay in sync with build docs.',
      trimmedObjectives
    ],
    sources: [
      { title: 'docs/CONSOLIDATED_BUILD.md', url: 'https://github.com/NarcoNations/local-mcp/tree/main/docs/CONSOLIDATED_BUILD.md' },
      { title: 'supabase/schema/0006_knowledge_embeddings.sql', url: 'https://github.com/NarcoNations/local-mcp/tree/main/supabase/schema/0006_knowledge_embeddings.sql' }
    ]
  };
}
