import KnowledgeView from './view';
import { sbServer } from '@/examples/next-adapter/lib/supabase/server';

type KnowledgeRow = {
  id: string;
  slug: string;
  title: string | null;
  manifest_path: string | null;
  created_at: string | null;
};

export default async function KnowledgePage() {
  const sb = sbServer();
  const { data } = await sb
    .from('knowledge')
    .select('id, slug, title, manifest_path, created_at')
    .order('created_at', { ascending: false })
    .limit(50);
  return <KnowledgeView initialRecords={(data || []) as KnowledgeRow[]} />;
}
