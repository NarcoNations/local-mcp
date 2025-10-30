export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { approvePublishPackage } from '@/examples/next-adapter/lib/mcp/publish';
import { validateApiKey } from '@/examples/next-adapter/lib/security/apiKeys';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await validateApiKey(_req.headers, 'publish:*', 'publish.approve', params.id);
  if (!auth.ok) {
    return new Response(auth.reason ?? 'unauthorized', { status: 401 });
  }
  const result = await approvePublishPackage(params.id);
  if (!result.ok) {
    return new Response(result.reason ?? 'unable to approve', { status: 500 });
  }
  return Response.json({ ok: true });
}
