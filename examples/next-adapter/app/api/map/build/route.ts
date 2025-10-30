import { NextRequest } from 'next/server';
import { requireScope } from '@/examples/next-adapter/lib/security/apiAuth';
import { enqueueJob } from '@/examples/next-adapter/lib/jobs/store';
import { featureFlags } from '@/examples/next-adapter/lib/env';

export async function POST(req: NextRequest) {
  try {
    await requireScope(req, 'map:*');
    const body = await req.json();
    if (!featureFlags.mapPipeline) {
      return new Response('Map pipeline disabled', { status: 503 });
    }
    const job = await enqueueJob('map:build', body);
    return Response.json({ ok: true, job });
  } catch (err: any) {
    const status = err?.status || 500;
    return new Response(err?.message || 'Failed to queue map build', { status });
  }
}
