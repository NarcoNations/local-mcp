import { NextRequest, NextResponse } from 'next/server';
import { sbServer } from '@/examples/next-adapter/lib/supabase/server';
import { recordAudit } from '@/examples/next-adapter/lib/audit';
import { logEvent } from '@/examples/next-adapter/lib/historian';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.id || !body?.jobKind) {
    return NextResponse.json({ error: 'id and jobKind required' }, { status: 400 });
  }
  const sb = sbServer();
  const { data: brief, error } = await sb
    .from('build_briefs')
    .select('*')
    .eq('id', body.id)
    .maybeSingle();
  if (error || !brief) {
    return NextResponse.json({ error: 'Brief not found' }, { status: 404 });
  }

  const { error: jobError } = await sb
    .from('jobs')
    .insert({
      kind: body.jobKind,
      payload: { brief_id: brief.id, title: brief.title },
    });
  if (jobError) {
    return NextResponse.json({ error: jobError.message }, { status: 500 });
  }

  await logEvent({
    source: 'mvp',
    kind: 'mvp.dispatched',
    title: `Brief dispatched — ${brief.title}`,
    meta: { jobKind: body.jobKind, briefId: brief.id },
  });

  await recordAudit({
    actor: request.headers.get('x-api-key-id') ?? 'web',
    action: 'mvp.send',
    resource: brief.id,
    meta: { jobKind: body.jobKind },
  });

  return NextResponse.json({ ok: true });
}
