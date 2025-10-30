export const runtime = 'nodejs';
import { NextRequest } from 'next/server';
import { logEvent } from '@/examples/next-adapter/lib/historian';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = typeof body?.query === 'string' ? body.query.trim() : '';
    const objectives = typeof body?.objectives === 'string' ? body.objectives.trim() : '';
    if (!query) return new Response('query is required', { status: 400 });

    const sections = buildSections(query, objectives);

    await logEvent({
      source: 'research',
      kind: 'api.research',
      title: `Research: ${query.slice(0, 60)}`,
      meta: { objectives: objectives.slice(0, 120) }
    });

    return Response.json({ ok: true, sections });
  } catch (e: any) {
    await logEvent({ source: 'research', kind: 'error', title: 'research run failed', body: e?.message || 'unknown' });
    return new Response('Error: ' + (e?.message || 'unknown'), { status: 500 });
  }
}

function buildSections(query: string, objectives: string) {
  const mission = objectives || 'Identify key facts and next actions.';
  return {
    facts: [
      `Baseline: ${query} is under active exploration — data gathered ${new Date().toISOString().split('T')[0]}.`,
      'Knowledge ingest flows into Supabase storage with md-convert manifests.',
      'Embeddings rely on MiniLM via @xenova/transformers running on CPU.'
    ],
    insights: [
      `Focus analysis on: ${mission}`,
      'Consider mapping Historian events into a health dashboard.',
      'Document risks around rate limits and local embedding throughput.'
    ],
    sources: [
      { title: 'docs/spec-kit/SPEC-INDEX-VIBEOS.md', url: '/docs/spec-kit/SPEC-INDEX-VIBEOS.md' },
      { title: 'supabase/schema/0006_knowledge_embeddings.sql', url: '/supabase/schema/0006_knowledge_embeddings.sql' },
      { title: 'examples/next-adapter/app/api/search/route.ts', url: '/examples/next-adapter/app/api/search/route.ts' }
    ]
  };
}
