export const runtime = 'nodejs';
import { NextRequest } from 'next/server';
import { indexKnowledge } from '@/examples/next-adapter/lib/knowledge/indexer';
import { logEvent } from '@/examples/next-adapter/lib/historian';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const slug = typeof body?.slug === 'string' ? body.slug : undefined;
    const knowledgeId = typeof body?.knowledge_id === 'string' ? body.knowledge_id : undefined;
    if (!slug && !knowledgeId) {
      return new Response('slug or knowledge_id is required', { status: 400 });
    }

    const result = await indexKnowledge({ slug, knowledgeId, source: 'knowledge', emitEvent: true });
    return Response.json({ ok: true, ...result });
  } catch (e: any) {
    await logEvent({
      source: 'knowledge',
      kind: 'error',
      title: 'knowledge index failed',
      body: e?.message || 'unknown'
    });
    return new Response('Error: ' + (e?.message || 'unknown'), { status: 500 });
  }
}
