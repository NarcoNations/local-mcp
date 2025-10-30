export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { flagEnabled } from '@/examples/next-adapter/lib/featureFlags';
import { validateApiKey } from '@/examples/next-adapter/lib/security/apiKeys';
import { logEvent } from '@/examples/next-adapter/lib/historian';

export async function POST(req: NextRequest) {
  if (!flagEnabled('mapPipeline')) {
    return new Response('Map pipeline disabled', { status: 503 });
  }
  const auth = await validateApiKey(req.headers, 'map:*', 'map.build', 'map_layers');
  if (!auth.ok) {
    return new Response(auth.reason ?? 'unauthorized', { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body || typeof body.source_url !== 'string') {
    return new Response('source_url required', { status: 400 });
  }
  await logEvent({
    source: 'map',
    kind: 'map.build.requested',
    title: 'Map build requested',
    meta: { source_url: body.source_url }
  });
  return Response.json({ ok: true, status: 'queued', note: 'Jobs worker will pick up map:build task.' });
}
