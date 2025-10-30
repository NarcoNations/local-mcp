import { createClient } from '@supabase/supabase-js';
import { mockBriefs } from '@/examples/next-adapter/lib/mocks/m3';
import { logEvent } from '@/examples/next-adapter/lib/historian';

export type BuildBrief = {
  id: string;
  title: string;
  lanes: any;
  acceptance_criteria: string[];
  owner: string;
  status: string;
  created_at: string;
  zip_url?: string | null;
};

function supabaseService() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function listBriefs(): Promise<BuildBrief[]> {
  if (process.env.USE_MOCKS === 'true') return mockBriefs as BuildBrief[];
  const sb = supabaseService();
  if (!sb) return [];
  const { data } = await sb.from('build_briefs').select('*').order('created_at', { ascending: false });
  return (data ?? []) as BuildBrief[];
}

export async function attachZip(id: string, zipUrl: string) {
  const sb = supabaseService();
  if (!sb) return;
  await sb.from('build_briefs').update({ zip_url: zipUrl }).eq('id', id);
}

export async function logBriefEvent(kind: string, meta: Record<string, any>) {
  await logEvent({ source: 'mvp', kind: `mvp.${kind}`, title: kind, meta });
}
