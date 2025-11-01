import { NextRequest, NextResponse } from 'next/server';
import { sbServer } from '@/examples/next-adapter/lib/supabase/server';
import { logEvent } from '@/examples/next-adapter/lib/historian';
import { isFlagEnabled } from '@/examples/next-adapter/lib/featureFlags';
import { recordAudit } from '@/examples/next-adapter/lib/audit';
import { runPolicyChecks } from '@/examples/next-adapter/lib/policy';

export async function POST(request: NextRequest) {
  if (!isFlagEnabled('FF_MAP_PIPELINE')) {
    return NextResponse.json({ error: 'Map pipeline disabled' }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  if (!body?.name || !body?.source_url) {
    return NextResponse.json({ error: 'name and source_url required' }, { status: 400 });
  }
  const sb = sbServer();

  const policy = await runPolicyChecks({
    scope: 'publish:*',
    action: 'map:build',
    content: body.name + ' ' + body.source_url,
    meta: body,
  });
  if (!policy.passed) {
    return NextResponse.json({ error: 'Policy gate failed', reasons: policy.reasons }, { status: 412 });
  }

  const { data: layer, error: upsertError } = await sb
    .from('map_layers')
    .upsert({
      name: body.name,
      type: body.type ?? 'geojson',
      source_url: body.source_url,
      status: 'queued',
      updated_at: new Date().toISOString(),
    })
    .select()
    .maybeSingle();
  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  const { error: jobError } = await sb.from('jobs').insert({
    kind: 'map:build',
    payload: { layer_id: layer?.id, source_url: body.source_url },
  });
  if (jobError) {
    return NextResponse.json({ error: jobError.message }, { status: 500 });
  }

  await logEvent({
    source: 'map',
    kind: 'map.build.queued',
    title: `Map build queued — ${body.name}`,
    meta: { layer },
  });

  await recordAudit({
    actor: request.headers.get('x-api-key-id') ?? 'web',
    action: 'map.build',
    resource: layer?.id,
    meta: { name: body.name },
  });

  return NextResponse.json({ layer, policy });
}
