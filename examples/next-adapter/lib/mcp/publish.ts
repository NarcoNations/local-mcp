import { createClient } from '@supabase/supabase-js';
import { mockPackages } from '@/examples/next-adapter/lib/mocks/m3';
import { logEvent } from '@/examples/next-adapter/lib/historian';

export type PublishPackage = {
  id: string;
  title: string;
  status: 'pending' | 'approved' | 'rejected';
  content_md: string;
  assets?: { name: string; url: string }[];
  meta?: Record<string, any>;
  created_at: string;
  approved_at?: string | null;
  link?: string;
};

function supabaseService() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function listPublishPackages(): Promise<PublishPackage[]> {
  if (process.env.USE_MOCKS === 'true') {
    return mockPackages as PublishPackage[];
  }
  const sb = supabaseService();
  if (!sb) return [];
  const { data } = await sb.from('publish_packages').select('*').order('created_at', { ascending: false });
  return (data ?? []) as PublishPackage[];
}

export async function stagePublishPackage(pkg: PublishPackage) {
  if (process.env.USE_MOCKS === 'true') {
    await logEvent({
      source: 'mcp',
      kind: 'publish.package.staged',
      title: `Staged ${pkg.title}`,
      meta: { id: pkg.id }
    });
    return pkg;
  }
  const sb = supabaseService();
  if (!sb) return pkg;
  await sb.from('publish_packages').insert(pkg);
  await logEvent({
    source: 'mcp',
    kind: 'publish.package.staged',
    title: `Staged ${pkg.title}`,
    meta: { id: pkg.id }
  });
  return pkg;
}

export async function approvePublishPackage(id: string) {
  const now = new Date().toISOString();
  if (process.env.USE_MOCKS === 'true') {
    await logEvent({
      source: 'mcp',
      kind: 'publish.package.approved',
      title: `Approved package ${id}`,
    });
    return { ok: true };
  }
  const sb = supabaseService();
  if (!sb) return { ok: false, reason: 'missing supabase' };
  await sb.from('publish_packages').update({ status: 'approved', approved_at: now }).eq('id', id);
  await logEvent({
    source: 'mcp',
    kind: 'publish.package.approved',
    title: `Approved package ${id}`,
  });
  return { ok: true };
}
