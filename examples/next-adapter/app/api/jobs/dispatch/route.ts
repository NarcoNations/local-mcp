import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { sbServer } from '@/examples/next-adapter/lib/supabase/server';
import { requireScope } from '@/examples/next-adapter/lib/security/apiKeys';
import { logEvent } from '@/examples/next-adapter/lib/historian';

export async function POST(request: Request) {
  const scopeCheck = await requireScope(request as any, 'admin:*');
  if ('status' in scopeCheck) {
    return NextResponse.json(scopeCheck.body, { status: scopeCheck.status });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.kind !== 'string') {
    return NextResponse.json({ error: 'Missing job kind' }, { status: 400 });
  }

  const job = {
    id: body.id ?? crypto.randomUUID(),
    kind: body.kind,
    status: 'queued',
    payload: body.payload ?? {},
    queued_at: new Date().toISOString(),
    run_at: body.run_at ?? null,
  };

  try {
    const sb = sbServer();
    await sb.from('jobs').insert(job);
    await logEvent({
      source: 'jobs',
      kind: 'job.queued',
      title: `${body.kind} queued`,
      meta: { id: job.id },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Failed to queue job' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, job });
}
