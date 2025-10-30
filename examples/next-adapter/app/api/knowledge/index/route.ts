export const runtime = 'nodejs';
import { NextRequest } from 'next/server';
import { indexKnowledgeBySlug, indexKnowledgeById } from '@/examples/next-adapter/lib/knowledge/indexer';
import { logEvent } from '@/examples/next-adapter/lib/historian';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const slug = typeof body.slug === 'string' ? body.slug.trim() : '';
    const knowledgeId = typeof body.knowledge_id === 'string' ? body.knowledge_id.trim() : '';
    if (!slug && !knowledgeId) {
      return new Response('slug or knowledge_id required', { status: 400 });
    }
    const result = slug ? await indexKnowledgeBySlug(slug) : await indexKnowledgeById(knowledgeId);
    await logEvent({
      source: 'knowledge',
      kind: 'knowledge.index',
      title: `Indexed knowledge ${result.slug}`,
      meta: { slug: result.slug, knowledgeId: result.knowledgeId, chunks: result.chunks }
    });
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
