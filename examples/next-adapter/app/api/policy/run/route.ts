import { NextRequest } from 'next/server';
import { requireScope } from '@/examples/next-adapter/lib/security/apiAuth';
import { runPolicyChecks, shadowSelfSummary } from '@/examples/next-adapter/lib/policy/checks';

export async function POST(req: NextRequest) {
  try {
    await requireScope(req, 'publish:*');
    const body = await req.json();
    const action = body.action || 'publish';
    const content = body.content || '';
    const meta = body.meta || {};
    const result = await runPolicyChecks(action, content, meta);
    if (action.startsWith('publish:') || action.startsWith('social:')) {
      await shadowSelfSummary(action, content);
    }
    return Response.json({ ok: true, result });
  } catch (err: any) {
    const status = err?.status || 500;
    return new Response(err?.message || 'Policy check failed', { status });
  }
}
