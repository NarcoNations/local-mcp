import { NextRequest, NextResponse } from 'next/server';
import { sbServer } from '@/examples/next-adapter/lib/supabase/server';
import { logEvent } from '@/examples/next-adapter/lib/historian';
import { recordAudit } from '@/examples/next-adapter/lib/audit';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.kind) {
    return NextResponse.json({ error: 'Missing job kind' }, { status: 400 });
  }
  const supabase = sbServer();
  const payload = body.payload ?? {};
  const { data, error } = await supabase
    .from('jobs')
    .insert({
      kind: body.kind,
      payload,
      status: 'queued',
      priority: body.priority ?? 5,
      scheduled_at: body.scheduled_at ?? new Date().toISOString(),
    })
    .select()
    .maybeSingle();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logEvent({
    source: 'jobs',
    kind: 'job.queued',
    title: `${body.kind} job queued`,
    meta: { job: data },
  });

  const actor = request.headers.get('x-api-key-id') ?? 'anon';
  await recordAudit({
    actor,
    action: 'jobs.dispatch',
    resource: body.kind,
    meta: { jobId: data.id },
  });

  return NextResponse.json({ job: data });
}
