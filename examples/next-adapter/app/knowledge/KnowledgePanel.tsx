'use client';
import { useState, type CSSProperties } from 'react';

type Knowledge = {
  id: string;
  slug: string;
  title: string | null;
  created_at: string | null;
  meta: Record<string, any> | null;
};

type Props = {
  initial: Knowledge[];
};

type Status = {
  state: 'idle' | 'running' | 'done' | 'error';
  message?: string;
};

export function KnowledgePanel({ initial }: Props) {
  const [items] = useState(initial);
  const [status, setStatus] = useState<Record<string, Status>>({});

  async function handleIndex(slug: string) {
    setStatus((prev) => ({ ...prev, [slug]: { state: 'running' } }));
    try {
      const res = await fetch('/api/knowledge/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug })
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setStatus((prev) => ({
        ...prev,
        [slug]: { state: 'done', message: `${json.chunks ?? 0} chunks` }
      }));
    } catch (err: any) {
      setStatus((prev) => ({
        ...prev,
        [slug]: { state: 'error', message: err?.message || 'Failed' }
      }));
    }
  }

  if (!items.length) {
    return <p style={{ opacity: 0.7 }}>No knowledge records yet. Ingest documents to get started.</p>;
  }

  return (
    <section
      style={{
        display: 'grid',
        gap: 16,
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))'
      }}
    >
      {items.map((item) => {
        const meta = item.meta || {};
        const current = status[item.slug] || { state: 'idle' };
        const created = item.created_at ? new Date(item.created_at).toLocaleString() : '—';
        return (
          <article
            key={item.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              padding: '16px 18px',
              borderRadius: 16,
              border: '1px solid rgba(0,0,0,0.08)',
              background: 'rgba(20,20,30,0.04)'
            }}
          >
            <header style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <strong style={{ fontSize: '1.05rem' }}>{item.title || item.slug}</strong>
              <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>{item.slug}</span>
            </header>
            <dl style={{ margin: 0, display: 'grid', gap: 6, fontSize: '0.9rem' }}>
              <div style={rowStyle}>
                <dt>Created</dt>
                <dd>{created}</dd>
              </div>
              <div style={rowStyle}>
                <dt>Files</dt>
                <dd>{meta.file_count ?? '—'}</dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={() => handleIndex(item.slug)}
              disabled={current.state === 'running'}
              style={{
                marginTop: 'auto',
                alignSelf: 'flex-start',
                padding: '10px 16px',
                borderRadius: 999,
                border: 'none',
                background: 'linear-gradient(135deg, rgba(40,40,60,0.9), rgba(80,80,110,0.85))',
                color: 'white',
                cursor: current.state === 'running' ? 'wait' : 'pointer',
                fontWeight: 600
              }}
            >
              {current.state === 'running' ? 'Indexing…' : 'Index for search'}
            </button>
            {current.state !== 'idle' && (
              <p
                style={{
                  margin: 0,
                  fontSize: '0.85rem',
                  color: current.state === 'error' ? 'crimson' : 'rgba(20,20,30,0.8)'
                }}
              >
                {current.message || (current.state === 'done' ? 'Ready for search.' : 'Working…')}
              </p>
            )}
          </article>
        );
      })}
    </section>
  );
}

const rowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12
};
