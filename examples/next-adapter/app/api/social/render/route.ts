import { NextRequest } from 'next/server';
import { requireScope } from '@/examples/next-adapter/lib/security/apiAuth';
import { enqueueJob } from '@/examples/next-adapter/lib/jobs/store';
import { featureFlags } from '@/examples/next-adapter/lib/env';

export async function POST(req: NextRequest) {
  try {
    await requireScope(req, 'social:*');
    if (!featureFlags.socialPipeline) {
      return new Response('Social pipeline disabled', { status: 503 });
    }
    const body = await req.json();
    const job = await enqueueJob('social:render', body);
    return Response.json({ ok: true, job });
  } catch (err: any) {
    const status = err?.status || 500;
    return new Response(err?.message || 'Failed to queue render', { status });
  }
}
