import { NextRequest, NextResponse } from 'next/server';
import { sbServer } from '@/examples/next-adapter/lib/supabase/server';
import { recordAudit } from '@/examples/next-adapter/lib/audit';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.title) {
    return NextResponse.json({ error: 'title required' }, { status: 400 });
  }
  const sb = sbServer();
  const { data, error } = await sb
    .from('build_briefs')
    .insert({
      title: body.title,
      lanes: body.lanes ?? [],
      acceptance_criteria: body.acceptance_criteria ?? '',
      owner: body.owner ?? 'unassigned',
      status: body.status ?? 'draft',
    })
    .select()
    .maybeSingle();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await recordAudit({
    actor: request.headers.get('x-api-key-id') ?? 'web',
    action: 'mvp.brief.create',
    resource: data?.id ?? 'brief',
    meta: { title: body.title },
  });

  return NextResponse.json({ brief: data });
}
