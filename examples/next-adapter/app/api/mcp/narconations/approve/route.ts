import { NextRequest, NextResponse } from 'next/server';
import { sbServer } from '@/examples/next-adapter/lib/supabase/server';
import { logEvent } from '@/examples/next-adapter/lib/historian';
import { recordAudit } from '@/examples/next-adapter/lib/audit';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }
  const sb = sbServer();
  const { data, error } = await sb
    .from('publish_packages')
    .update({ status: 'approved', approved_at: new Date().toISOString(), approved_by: request.headers.get('x-api-key-id') ?? 'web' })
    .eq('id', body.id)
    .select()
    .maybeSingle();
  if (error || !data) {
    return NextResponse.json({ error: 'Package not found' }, { status: 404 });
  }

  await logEvent({
    source: 'publish',
    kind: 'publish.approved',
    title: `Package approved — ${data.slug}`,
    meta: { id: data.id },
  });

  await recordAudit({
    actor: request.headers.get('x-api-key-id') ?? 'web',
    action: 'mcp.approve',
    resource: data.id,
    meta: { slug: data.slug },
  });

  return NextResponse.json({ package: data });
}
