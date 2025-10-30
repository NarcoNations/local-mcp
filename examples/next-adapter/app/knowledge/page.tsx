import { sbServer } from '@/examples/next-adapter/lib/supabase/server';
import { KnowledgePanel } from './KnowledgePanel';

type Knowledge = {
  id: string;
  slug: string;
  title: string | null;
  created_at: string | null;
  meta: Record<string, any> | null;
};

export default async function KnowledgePage() {
  const sb = sbServer();
  const { data } = await sb
    .from('knowledge')
    .select('id, slug, title, created_at, meta')
    .order('created_at', { ascending: false })
    .limit(24);
  const items = (data as Knowledge[] | null) || [];
  return (
    <main style={{ padding: 'min(4vw, 32px)', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ fontSize: 'clamp(1.75rem, 2.5vw, 2.5rem)', margin: 0 }}>Knowledge Vault</h1>
        <p style={{ maxWidth: 720, lineHeight: 1.5 }}>
          Converted documents appear here. Trigger the embedding pass to push Markdown chunks into pgvector for semantic search.
        </p>
      </header>
      <KnowledgePanel initial={items} />
    </main>
  );
}
