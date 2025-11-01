import { NextRequest, NextResponse } from 'next/server';
import { sbServer } from '@/examples/next-adapter/lib/supabase/server';
import { runPolicyChecks } from '@/examples/next-adapter/lib/policy';
import { logEvent } from '@/examples/next-adapter/lib/historian';
import { recordAudit } from '@/examples/next-adapter/lib/audit';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.slug || !body?.content_md) {
    return NextResponse.json({ error: 'slug and content_md required' }, { status: 400 });
  }
  const sb = sbServer();
  const policy = await runPolicyChecks({
    scope: 'publish:*',
    action: 'publish:package',
    content: body.content_md,
    meta: body,
  });
  if (!policy.passed) {
    return NextResponse.json({ error: 'Policy gate failed', reasons: policy.reasons }, { status: 412 });
  }

  const { data, error } = await sb
    .from('publish_packages')
    .upsert(
      {
        slug: body.slug,
        content_md: body.content_md,
        assets: body.assets ?? [],
        meta: body.meta ?? {},
        status: 'pending',
      },
      { onConflict: 'slug' }
    )
    .select()
    .maybeSingle();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logEvent({
    source: 'publish',
    kind: 'publish.package',
    title: `Package staged — ${body.slug}`,
    meta: { id: data?.id },
  });

  await recordAudit({
    actor: request.headers.get('x-api-key-id') ?? 'web',
    action: 'mcp.publish',
    resource: data?.id ?? body.slug,
    meta: { slug: body.slug },
  });

  return NextResponse.json({ package: data, policy });
}
