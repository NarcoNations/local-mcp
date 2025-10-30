'use client';

import { useState } from 'react';

type KnowledgeRow = {
  id: string;
  slug: string;
  title: string | null;
  manifest_path: string | null;
  created_at: string | null;
  sha256: string | null;
};

type Props = {
  items: KnowledgeRow[];
};

type Status = {
  loading: boolean;
  message?: string;
  error?: string;
  chunks?: number;
  durationMs?: number;
};

export default function KnowledgeClient({ items }: Props) {
  const [status, setStatus] = useState<Record<string, Status>>({});

  async function handleIndex(slug: string) {
    setStatus((prev) => ({ ...prev, [slug]: { loading: true } }));
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
        [slug]: {
          loading: false,
          message: 'Indexed',
          chunks: json.chunks?.length ?? 0,
          durationMs: json.durationMs
        }
      }));
    } catch (err: any) {
      setStatus((prev) => ({
        ...prev,
        [slug]: {
          loading: false,
          error: err?.message || 'Index failed'
        }
      }));
    }
  }

  if (!items.length) {
    return (
      <main style={{ display: 'grid', gap: 16 }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>Knowledge</h1>
        <p style={{ color: 'rgb(85, 85, 85)' }}>No knowledge archives yet — upload via the Ingest surface.</p>
      </main>
    );
  }

  return (
    <main style={{ display: 'grid', gap: 24 }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>Knowledge</h1>
        <p style={{ color: 'rgb(85, 85, 85)', maxWidth: 600 }}>
          Run embeddings directly from the adapter. Each archive corresponds to an <code>archives/&lt;slug&gt;.zip</code> file in
          Supabase storage.
        </p>
      </header>
      <section
        style={{
          display: 'grid',
          gap: 16
        }}
      >
        {items.map((item) => {
          const state = status[item.slug];
          return (
            <article
              key={item.id}
              style={{
                border: '1px solid rgb(229, 229, 229)',
                borderRadius: 14,
                padding: '18px 20px',
                display: 'grid',
                gap: 12,
                background: 'rgb(252, 252, 252)'
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'baseline' }}>
                <h2 style={{ margin: 0, fontSize: 20 }}>{item.title || item.slug}</h2>
                <span style={{ fontSize: 13, color: 'rgb(119, 119, 119)' }}>{item.slug}</span>
              </div>
              <dl
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: 12,
                  margin: 0
                }}
              >
                <div>
                  <dt style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Created</dt>
                  <dd style={{ margin: '4px 0 0', fontSize: 14 }}>
                    {item.created_at ? new Date(item.created_at).toLocaleString() : '—'}
                  </dd>
                </div>
                <div>
                  <dt style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Manifest</dt>
                  <dd style={{ margin: '4px 0 0', fontSize: 14, wordBreak: 'break-all' }}>{item.manifest_path || '—'}</dd>
                </div>
                <div>
                  <dt style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>SHA256</dt>
                  <dd style={{ margin: '4px 0 0', fontSize: 14, wordBreak: 'break-all' }}>{item.sha256 || '—'}</dd>
                </div>
              </dl>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
                <button
                  onClick={() => handleIndex(item.slug)}
                  disabled={state?.loading}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 999,
                    border: 'none',
                    background: 'rgb(17, 17, 17)',
                    color: 'rgb(255, 255, 255)',
                    fontWeight: 600
                  }}
                >
                  {state?.loading ? 'Indexing…' : 'Index embeddings'}
                </button>
                {state?.message ? (
                  <span style={{ fontSize: 13, color: 'rgb(10, 124, 45)' }}>
                    {state.message} · {state.chunks ?? 0} chunks · {Math.round((state.durationMs ?? 0) / 100) / 10}s
                  </span>
                ) : null}
                {state?.error ? (
                  <span style={{ fontSize: 13, color: 'rgb(176, 0, 32)' }}>{state.error}</span>
                ) : null}
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
