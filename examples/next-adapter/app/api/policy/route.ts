import { NextResponse } from 'next/server';
import { runPolicyChecks } from '@/examples/next-adapter/lib/policy/checks';
import { requireScope } from '@/examples/next-adapter/lib/security/apiKeys';
import { sbServer } from '@/examples/next-adapter/lib/supabase/server';

function safeSupabase() {
  try {
    return sbServer();
  } catch (_) {
    return null;
  }
}

export async function GET() {
  const sb = safeSupabase();
  if (!sb) {
    return NextResponse.json({
      decisions: [],
      note: 'Supabase not configured; enable to view policy history.',
    });
  }

  const { data } = await sb
    .from('policy_checks')
    .select()
    .order('ts', { ascending: false })
    .limit(20);
  return NextResponse.json({ decisions: data ?? [] });
}

export async function POST(request: Request) {
  const scopeCheck = await requireScope(request as any, 'publish:*');
  if ('status' in scopeCheck) {
    return NextResponse.json(scopeCheck.body, { status: scopeCheck.status });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.action !== 'string' || typeof body.content !== 'string') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const decision = await runPolicyChecks({ action: body.action, content: body.content, meta: body.meta });
  return NextResponse.json(decision);
}
