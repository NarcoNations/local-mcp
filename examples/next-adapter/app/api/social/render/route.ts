import { NextRequest, NextResponse } from 'next/server';
import { sbServer } from '@/examples/next-adapter/lib/supabase/server';
import { logEvent } from '@/examples/next-adapter/lib/historian';
import { isFlagEnabled } from '@/examples/next-adapter/lib/featureFlags';
import { recordAudit } from '@/examples/next-adapter/lib/audit';
import { runPolicyChecks } from '@/examples/next-adapter/lib/policy';

export async function POST(request: NextRequest) {
  if (!isFlagEnabled('FF_SOCIAL_PIPELINE')) {
    return NextResponse.json({ error: 'Social pipeline disabled' }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  if (!body?.template || !body?.payload) {
    return NextResponse.json({ error: 'template and payload required' }, { status: 400 });
  }
  const sb = sbServer();
  const policy = await runPolicyChecks({
    scope: 'social:*',
    action: 'social:render',
    content: JSON.stringify(body.payload),
    meta: body,
  });
  if (!policy.passed) {
    return NextResponse.json({ error: 'Policy gate failed', reasons: policy.reasons }, { status: 412 });
  }

  const { data: queueRow, error } = await sb
    .from('social_queue')
    .insert({
      template: body.template,
      payload: body.payload,
      status: 'queued',
      scheduled_at: body.scheduled_at ?? null,
    })
    .select()
    .maybeSingle();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await sb.from('jobs').insert({
    kind: 'social:render',
    payload: { queue_id: queueRow?.id },
  });

  await logEvent({
    source: 'social',
    kind: 'social.render.queued',
    title: `Render queued — ${body.template}`,
    meta: { id: queueRow?.id },
  });

  await recordAudit({
    actor: request.headers.get('x-api-key-id') ?? 'web',
    action: 'social.render',
    resource: queueRow?.id ?? 'queue',
    meta: { template: body.template },
  });

  return NextResponse.json({ queue: queueRow, policy });
}
