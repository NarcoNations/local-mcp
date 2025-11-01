import { NextRequest, NextResponse } from 'next/server';
import { sbServer } from '@/examples/next-adapter/lib/supabase/server';
import { logEvent } from '@/examples/next-adapter/lib/historian';
import { recordAudit } from '@/examples/next-adapter/lib/audit';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.id) {
    return NextResponse.json({ error: 'build brief id required' }, { status: 400 });
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

  const skeleton = `# ${brief.title}\n\n## Acceptance Criteria\n${brief.acceptance_criteria}\n\n## Lanes\n${JSON.stringify(brief.lanes, null, 2)}\n\n// EDIT HERE: Expand docs for the build.`;
  const encoded = Buffer.from(skeleton).toString('base64');
  const dataUrl = `data:text/markdown;base64,${encoded}`;

  const { data: updated, error: updateError } = await sb
    .from('build_briefs')
    .update({
      status: 'generated',
      attachment_url: dataUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', brief.id)
    .select()
    .maybeSingle();
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await logEvent({
    source: 'mvp',
    kind: 'mvp.generate',
    title: `Build brief generated — ${brief.title}`,
    meta: { id: brief.id },
  });

  await recordAudit({
    actor: request.headers.get('x-api-key-id') ?? 'web',
    action: 'mvp.generate',
    resource: brief.id,
    meta: { title: brief.title },
  });

  return NextResponse.json({ brief: updated });
}
