export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { validateApiKey } from '@/examples/next-adapter/lib/security/apiKeys';
import { logBriefEvent } from '@/examples/next-adapter/lib/mvp/briefs';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.brief_id !== 'string') {
    return new Response('brief_id required', { status: 400 });
  }
  const auth = await validateApiKey(req.headers, 'admin:*', 'mvp.generate', body.brief_id);
  if (!auth.ok) {
    return new Response(auth.reason ?? 'unauthorized', { status: 401 });
  }
  // EDIT HERE: wire to generator service. For now we emit mock ZIP link.
  const zipUrl = `https://example.com/${body.brief_id}.zip`;
  await logBriefEvent('generate', { brief_id: body.brief_id, zipUrl });
  return Response.json({ ok: true, zip_url: zipUrl });
}
