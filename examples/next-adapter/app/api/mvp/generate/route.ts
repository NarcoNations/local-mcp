import { NextRequest } from 'next/server';
import { requireScope } from '@/examples/next-adapter/lib/security/apiAuth';
import { attachBundle } from '@/examples/next-adapter/lib/workroom/briefs';
import { sbAdmin } from '@/examples/next-adapter/lib/supabase/admin';
import { logEvent } from '@/examples/next-adapter/lib/historian';

export async function POST(req: NextRequest) {
  try {
    await requireScope(req, 'publish:*');
    const body = await req.json();
    const briefId = body.briefId;
    if (!briefId) return new Response('briefId required', { status: 400 });
    const supabase = sbAdmin();
    const { data: brief } = await supabase.from('build_briefs').select('*').eq('id', briefId).maybeSingle();
    if (!brief) return new Response('brief not found', { status: 404 });
    const files = [
      ['README.md', `# ${brief.title}\n\n${brief.acceptance_criteria}`],
      ['ACCEPTANCE.md', brief.acceptance_criteria],
      ['lanes.json', JSON.stringify(brief.lanes, null, 2)],
    ];
    const zipContent = Buffer.from(files.map(([name, content]) => `---${name}---\n${content}`).join('\n\n'));
    const bundleUrl = `data:application/zip;base64,${zipContent.toString('base64')}`;
    const updated = await attachBundle(briefId, bundleUrl);
    await logEvent({
      source: 'workroom.brief',
      kind: 'brief.generate',
      title: `Generated MVP bundle for ${brief.title}`,
      meta: { briefId },
    });
    return Response.json({ ok: true, brief: updated });
  } catch (err: any) {
    const status = err?.status || 500;
    return new Response(err?.message || 'Failed to generate MVP', { status });
  }
}
