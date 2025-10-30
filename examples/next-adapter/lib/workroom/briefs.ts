import { sbAdmin } from '@/examples/next-adapter/lib/supabase/admin';
import { logEvent } from '@/examples/next-adapter/lib/historian';

export type BuildBrief = {
  id: string;
  title: string;
  lanes: any;
  acceptance_criteria: string;
  owner: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  bundle_url?: string | null;
};

export async function createBuildBrief(data: {
  title: string;
  lanes: any;
  acceptanceCriteria: string;
  owner?: string;
}) {
  const supabase = sbAdmin();
  const id = `brief-${Date.now()}`;
  const now = new Date().toISOString();
  const { data: row, error } = await supabase
    .from('build_briefs')
    .insert({
      id,
      title: data.title,
      lanes: data.lanes,
      acceptance_criteria: data.acceptanceCriteria,
      owner: data.owner ?? null,
      status: 'draft',
      created_at: now,
      updated_at: now,
    })
    .select('*')
    .maybeSingle();
  if (error) throw error;
  await logEvent({ source: 'workroom.brief', kind: 'brief.created', title: data.title, meta: { id } });
  return row as BuildBrief;
}

export async function attachBundle(id: string, bundleUrl: string) {
  const supabase = sbAdmin();
  const { data, error } = await supabase
    .from('build_briefs')
    .update({ bundle_url: bundleUrl, status: 'packaged', updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  await logEvent({ source: 'workroom.brief', kind: 'brief.bundle', title: `Bundle generated for ${id}`, meta: { id, bundleUrl } });
  return data as BuildBrief;
}
