import { sbServer } from '@/examples/next-adapter/lib/supabase/server';
import KnowledgeClient from './KnowledgeClient';

type KnowledgeRow = {
  id: string;
  slug: string;
  title: string | null;
  manifest_path: string | null;
  created_at: string | null;
  sha256: string | null;
};

export default async function KnowledgePage() {
  try {
    const sb = sbServer();
    const { data } = await sb
      .from('knowledge')
      .select('id, slug, title, manifest_path, created_at, sha256')
      .order('created_at', { ascending: false })
      .limit(50);
    return <KnowledgeClient items={(data || []) as KnowledgeRow[]} />;
  } catch (err: any) {
    return (
      <main style={{ display: 'grid', gap: 16 }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>Knowledge</h1>
        <p style={{ color: 'rgb(176, 0, 32)', fontWeight: 600 }}>
          Unable to reach Supabase — set <code>SUPABASE_URL</code> and keys to view indexed knowledge.
        </p>
      </main>
    );
  }
}
