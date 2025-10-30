export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { validateApiKey } from '@/examples/next-adapter/lib/security/apiKeys';
import { flagEnabled } from '@/examples/next-adapter/lib/featureFlags';
import { stagePublishPackage } from '@/examples/next-adapter/lib/mcp/publish';

export async function POST(req: NextRequest) {
  if (!flagEnabled('socialPipeline') && !flagEnabled('mapPipeline')) {
    return new Response('Publishing flags disabled', { status: 503 });
  }
  const body = await req.json().catch(() => null);
  if (!body || typeof body.title !== 'string' || typeof body.content_md !== 'string') {
    return new Response('title + content_md required', { status: 400 });
  }
  const auth = await validateApiKey(req.headers, 'publish:*', 'publish.stage', body.title);
  if (!auth.ok) {
    return new Response(auth.reason ?? 'unauthorized', { status: 401 });
  }
  const pkg = await stagePublishPackage({
    id: crypto.randomUUID(),
    title: body.title,
    status: 'pending',
    content_md: body.content_md,
    assets: body.assets || [],
    meta: body.meta || {},
    created_at: new Date().toISOString(),
    link: body.link,
  });
  return Response.json({ ok: true, package: pkg });
}
