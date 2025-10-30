export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { validateApiKey } from '@/examples/next-adapter/lib/security/apiKeys';
import { flagEnabled } from '@/examples/next-adapter/lib/featureFlags';
import { logEvent } from '@/examples/next-adapter/lib/historian';

export async function POST(req: NextRequest) {
  if (!flagEnabled('socialPipeline')) {
    return new Response('Social pipeline disabled', { status: 503 });
  }
  const auth = await validateApiKey(req.headers, 'social:*', 'social.publish', 'social_queue');
  if (!auth.ok) {
    return new Response(auth.reason ?? 'unauthorized', { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body || typeof body.template !== 'string') {
    return new Response('template required', { status: 400 });
  }
  await logEvent({
    source: 'social',
    kind: 'social.publish.stub',
    title: `Stub publish ${body.template}`,
    meta: { template: body.template, payload: body.payload }
  });
  return Response.json({ ok: true, status: 'stubbed' });
}
