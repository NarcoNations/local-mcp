import { NextRequest, NextResponse } from 'next/server';
import { sbServer } from '@/examples/next-adapter/lib/supabase/server';
import { logEvent } from '@/examples/next-adapter/lib/historian';
import { isFlagEnabled } from '@/examples/next-adapter/lib/featureFlags';
import { recordAudit } from '@/examples/next-adapter/lib/audit';

export async function POST(request: NextRequest) {
  if (!isFlagEnabled('FF_SOCIAL_PIPELINE')) {
    return NextResponse.json({ error: 'Social pipeline disabled' }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  if (!body?.id) {
    return NextResponse.json({ error: 'queue id required' }, { status: 400 });
  }
  const sb = sbServer();
  const { data: queue, error } = await sb
    .from('social_queue')
    .select('*')
    .eq('id', body.id)
    .maybeSingle();
  if (error || !queue) {
    return NextResponse.json({ error: 'Queue item not found' }, { status: 404 });
  }

  await sb
    .from('social_queue')
    .update({ status: 'published', posted_at: new Date().toISOString() })
    .eq('id', queue.id);

  await logEvent({
    source: 'social',
    kind: 'social.publish.stub',
    title: `Publish stub — ${queue.template}`,
    meta: { id: queue.id },
  });

  await recordAudit({
    actor: request.headers.get('x-api-key-id') ?? 'web',
    action: 'social.publish',
    resource: queue.id,
    meta: { template: queue.template },
  });

  return NextResponse.json({ status: 'stubbed', queue });
}
