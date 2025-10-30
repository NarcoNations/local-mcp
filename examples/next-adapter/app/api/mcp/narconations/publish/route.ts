import { NextRequest } from 'next/server';
import { requireScope } from '@/examples/next-adapter/lib/security/apiAuth';
import { runPolicyChecks, shadowSelfSummary } from '@/examples/next-adapter/lib/policy/checks';
import { sbAdmin } from '@/examples/next-adapter/lib/supabase/admin';
import { logEvent } from '@/examples/next-adapter/lib/historian';

export async function POST(req: NextRequest) {
  try {
    const principal = await requireScope(req, 'publish:*');
    const body = await req.json();
    const content = body.content_md || body.content || '';
    const assets = body.assets || [];
    const meta = body.meta || {};
    const result = await runPolicyChecks('publish:narconations', content, meta);
    await shadowSelfSummary('publish:narconations', content);
    if (!result.passed) {
      return new Response('Policy check failed', { status: 403 });
    }
    const supabase = sbAdmin();
    const id = body.id || `pkg-${Date.now()}`;
    const { data, error } = await supabase
      .from('publish_packages')
      .upsert({
        id,
        content_md: content,
        assets,
        meta,
        approved: false,
        created_at: new Date().toISOString(),
        source: 'narconations',
      })
      .select('*')
      .maybeSingle();
    if (error) throw error;
    await logEvent({
      source: 'publish.narconations',
      kind: 'publish.package',
      title: 'NarcoNations package staged',
      meta: { id, actor: principal.id },
    });
    return Response.json({ ok: true, package: data });
  } catch (err: any) {
    const status = err?.status || 500;
    return new Response(err?.message || 'Failed to stage publish package', { status });
  }
}
