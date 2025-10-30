import { NextRequest } from 'next/server';
import { requireScope } from '@/examples/next-adapter/lib/security/apiAuth';
import { queueSocialPublish } from '@/examples/next-adapter/lib/social/pipeline';

export async function POST(req: NextRequest) {
  try {
    const principal = await requireScope(req, 'social:*');
    const body = await req.json();
    const queueId = body.queueId || body.id;
    if (!queueId) {
      return new Response('queueId required', { status: 400 });
    }
    await queueSocialPublish(queueId, principal.id);
    return Response.json({ ok: true });
  } catch (err: any) {
    const status = err?.status || 500;
    return new Response(err?.message || 'Failed to publish', { status });
  }
}
