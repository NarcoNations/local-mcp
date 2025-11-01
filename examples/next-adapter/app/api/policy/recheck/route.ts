import { NextRequest, NextResponse } from 'next/server';
import { sbServer } from '@/examples/next-adapter/lib/supabase/server';
import { runPolicyChecks } from '@/examples/next-adapter/lib/policy';
import { recordAudit } from '@/examples/next-adapter/lib/audit';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }
  const sb = sbServer();
  const { data: log, error } = await sb
    .from('policy_gate_logs')
    .select('*')
    .eq('id', body.id)
    .maybeSingle();
  if (error || !log) {
    return NextResponse.json({ error: 'Log not found' }, { status: 404 });
  }
  const result = await runPolicyChecks({
    scope: log.scope,
    action: log.action,
    content: (log.payload?.content as string) ?? '',
    meta: log.payload ?? {},
  });
  await recordAudit({
    actor: request.headers.get('x-api-key-id') ?? 'web',
    action: 'policy.recheck',
    resource: log.action,
    meta: { logId: log.id },
  });
  return NextResponse.json({ result });
}
