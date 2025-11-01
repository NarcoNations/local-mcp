'use client';
import { useState, type CSSProperties } from 'react';

type KnowledgeRow = {
  id: string;
  slug: string;
  title: string | null;
  manifest_path: string | null;
  created_at: string | null;
};

type KnowledgeViewProps = {
  initialRecords: KnowledgeRow[];
};

export default function KnowledgeView({ initialRecords }: KnowledgeViewProps) {
  const [records] = useState(initialRecords);
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function triggerIndex(slug: string) {
    setBusySlug(slug);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch('/api/knowledge/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug })
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setMessage(`Indexed ${json.result?.chunks ?? 0} chunks for ${slug}.`);
    } catch (err: any) {
      setError(err?.message || 'Indexing failed');
    } finally {
      setBusySlug(null);
    }
  }

  return (
    <main style={mainStyle}>
      <section style={cardStyle}>
        <header style={headerStyle}>
          <div>
            <h1 style={titleStyle}>Knowledge Vault</h1>
            <p style={leadStyle}>
              Recent conversions staged for embedding. Trigger inline indexing and monitor the Historian timeline for progress.
            </p>
          </div>
          {message && <p style={statusStyle}>{message}</p>}
          {error && <p style={errorStyle}>{error}</p>}
        </header>
        <div style={gridStyle}>
          {records.length === 0 && <p style={{ margin: 0 }}>No knowledge ingested yet. Use the ingest pipeline to seed content.</p>}
          {records.map((record) => (
            <article key={record.id} style={itemStyle}>
              <div>
                <h2 style={itemTitleStyle}>{record.title || record.slug}</h2>
                <p style={itemMetaStyle}>
                  slug: {record.slug}
                  <br />
                  manifest: {record.manifest_path || '—'}
                  <br />
                  added: {record.created_at ? new Date(record.created_at).toLocaleString() : '—'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => triggerIndex(record.slug)}
                disabled={busySlug === record.slug}
                style={buttonStyle}
              >
                {busySlug === record.slug ? 'Indexing…' : 'Index now'}
              </button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

const mainStyle: CSSProperties = {
  display: 'grid',
  padding: '24px 0',
};

const cardStyle: CSSProperties = {
  background: 'rgb(255,255,255)',
  borderRadius: '16px',
  padding: '24px',
  boxShadow: '0 12px 32px rgba(15,23,42,0.08)',
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
};

const headerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: '1.75rem',
};

const leadStyle: CSSProperties = {
  margin: 0,
  color: 'rgba(0,0,0,0.65)',
  lineHeight: 1.6,
};

const statusStyle: CSSProperties = {
  margin: 0,
  color: 'rgba(22,101,52,0.9)',
  fontWeight: 600,
};

const errorStyle: CSSProperties = {
  margin: 0,
  color: 'rgba(190,18,60,0.9)',
  fontWeight: 600,
};

const gridStyle: CSSProperties = {
  display: 'grid',
  gap: '16px',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
};

const itemStyle: CSSProperties = {
  background: 'rgba(15,23,42,0.05)',
  borderRadius: '16px',
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  gap: '12px',
};

const itemTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '1.1rem',
};

const itemMetaStyle: CSSProperties = {
  margin: 0,
  fontSize: '0.9rem',
  color: 'rgba(0,0,0,0.65)',
  lineHeight: 1.5,
};

const buttonStyle: CSSProperties = {
  alignSelf: 'flex-start',
  padding: '10px 18px',
  borderRadius: '999px',
  border: 'none',
  background: 'rgba(37,99,235,0.85)',
  color: 'white',
  fontWeight: 600,
  cursor: 'pointer',
};
