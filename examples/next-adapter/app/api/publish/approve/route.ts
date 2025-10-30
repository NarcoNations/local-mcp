import { NextRequest } from 'next/server';
import { requireScope } from '@/examples/next-adapter/lib/security/apiAuth';
import { sbAdmin } from '@/examples/next-adapter/lib/supabase/admin';
import { logEvent } from '@/examples/next-adapter/lib/historian';

export async function POST(req: NextRequest) {
  try {
    const principal = await requireScope(req, 'publish:*');
    const body = await req.json();
    const id = body.id;
    if (!id) return new Response('id required', { status: 400 });
    const supabase = sbAdmin();
    const { data, error } = await supabase
      .from('publish_packages')
      .update({ approved: true, approved_at: new Date().toISOString(), approver: principal.id })
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    await logEvent({
      source: 'publish',
      kind: 'publish.approved',
      title: `Package ${id} approved`,
      meta: { id, actor: principal.id },
    });
    return Response.json({ ok: true, package: data });
  } catch (err: any) {
    const status = err?.status || 500;
    return new Response(err?.message || 'Failed to approve package', { status });
  }
}
