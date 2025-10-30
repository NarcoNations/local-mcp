import { NextRequest } from 'next/server';
import { requireScope } from '@/examples/next-adapter/lib/security/apiAuth';
import { createBuildBrief } from '@/examples/next-adapter/lib/workroom/briefs';

export async function POST(req: NextRequest) {
  try {
    await requireScope(req, 'publish:*');
    const body = await req.json();
    const brief = await createBuildBrief({
      title: body.title,
      lanes: body.lanes,
      acceptanceCriteria: body.acceptanceCriteria,
      owner: body.owner,
    });
    return Response.json({ ok: true, brief });
  } catch (err: any) {
    const status = err?.status || 500;
    return new Response(err?.message || 'Failed to create brief', { status });
  }
}
