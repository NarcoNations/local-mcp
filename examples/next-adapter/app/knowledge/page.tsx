import { sbServer } from '@/examples/next-adapter/lib/supabase/server';
import { KnowledgeIndexButton } from './index-button';

type KnowledgeRow = {
  id: string;
  slug: string;
  title: string | null;
  created_at: string;
  meta: any;
};

export default async function KnowledgePage() {
  if (!process.env.SUPABASE_URL) {
    return (
      <div style={{ display: 'grid', gap: '16px' }}>
        <h1 style={{ margin: 0 }}>Knowledge</h1>
        <p style={{ margin: 0, color: 'rgba(0,0,0,0.6)' }}>
          Configure Supabase credentials to view and index ingested knowledge sources.
        </p>
      </div>
    );
  }

  let knowledge: KnowledgeRow[] = [];
  let errorMessage: string | null = null;
  try {
    const sb = sbServer();
    const { data, error } = await sb
      .from('knowledge')
      .select('id, slug, title, created_at, meta')
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) errorMessage = error.message;
    knowledge = (data as KnowledgeRow[]) || [];
  } catch (err: any) {
    errorMessage = err?.message || 'Unable to load knowledge records';
  }

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ margin: 0 }}>Knowledge Vault</h1>
        <p style={{ margin: 0, color: 'rgba(0,0,0,0.65)', maxWidth: 640 }}>
          Inspect recent uploads, review manifest metadata, and trigger embedding jobs for semantic search.
        </p>
      </header>
      {errorMessage && <p style={{ margin: 0, color: 'rgb(180,0,0)' }}>{errorMessage}</p>}
      <section
        style={{
          display: 'grid',
          gap: '16px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))'
        }}
      >
        {knowledge.map((item) => (
          <article
            key={item.id}
            style={{
              borderRadius: '16px',
              border: '1px solid rgba(0,0,0,0.08)',
              background: 'rgba(255,255,255,0.96)',
              padding: '20px',
              display: 'grid',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{item.title || item.slug}</h2>
              <span style={{ fontSize: '0.85rem', color: 'rgba(0,0,0,0.6)' }}>
                {new Date(item.created_at).toLocaleString()} · slug: {item.slug}
              </span>
            </div>
            {item.meta && (
              <pre
                style={{
                  margin: 0,
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'rgba(0,0,0,0.05)',
                  fontSize: '0.85rem',
                  overflowX: 'auto'
                }}
              >
                {JSON.stringify(item.meta, null, 2)}
              </pre>
            )}
            <KnowledgeIndexButton slug={item.slug} knowledgeId={item.id} />
          </article>
        ))}
        {!knowledge.length && !errorMessage && (
          <p style={{ margin: 0, color: 'rgba(0,0,0,0.6)' }}>No knowledge records yet. Ingest content to see it here.</p>
        )}
      </section>
    </div>
  );
}
