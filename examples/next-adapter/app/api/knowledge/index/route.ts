export const runtime = 'nodejs';
import { NextRequest } from 'next/server';
import { runEmbeddingJob } from '@/examples/next-adapter/lib/embeddings/indexer';
import { logEvent } from '@/examples/next-adapter/lib/historian';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const slug = typeof body?.slug === 'string' ? body.slug : undefined;
    const knowledgeId = typeof body?.knowledge_id === 'string' ? body.knowledge_id : undefined;
    if (!slug && !knowledgeId) {
      return new Response('Provide slug or knowledge_id', { status: 400 });
    }
    const started = Date.now();
    const result = await runEmbeddingJob({ slug, knowledgeId });
    const durationMs = Date.now() - started;
    await logEvent({
      source: 'embeddings',
      kind: 'knowledge.index',
      title: `Indexed ${result.slug}`,
      meta: { knowledgeId: result.knowledgeId, chunks: result.chunks.length, durationMs }
    });
    return Response.json({ ok: true, ...result, durationMs });
  } catch (err: any) {
    await logEvent({ source: 'embeddings', kind: 'error', title: 'knowledge index failed', body: err?.message });
    return new Response('Error: ' + (err?.message || 'unknown'), { status: 500 });
  }
}
