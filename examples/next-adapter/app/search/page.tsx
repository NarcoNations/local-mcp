'use client';
import { useState } from 'react';

type SearchHit = {
  knowledge_id: string;
  slug: string | null;
  title: string | null;
  chunk_ix: number;
  content: string;
  score: number;
};

type SearchResponse = {
  ok: boolean;
  results: SearchHit[];
};

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!query.trim()) {
      setError('Enter a question or keyword.');
      return;
    }
    setBusy(true);
    setError(null);
    setHits([]);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: query.trim() })
      });
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as SearchResponse;
      setHits(json.results || []);
    } catch (err: any) {
      setError(err?.message || 'Search failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ padding: 'min(4vw, 32px)', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ fontSize: 'clamp(1.75rem, 2.5vw, 2.5rem)', margin: 0 }}>Semantic Search</h1>
        <p style={{ maxWidth: 720, lineHeight: 1.5 }}>
          Queries run against MiniLM embeddings stored in pgvector. Scores reflect cosine similarity; higher values surface more
          relevant chunks.
        </p>
      </header>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 640 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 600 }}>
          Question or topic
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={3}
            placeholder="How does our product onboarding flow work?"
            style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.15)', resize: 'vertical' }}
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          style={{
            alignSelf: 'flex-start',
            padding: '10px 18px',
            borderRadius: 999,
            border: 'none',
            background: 'linear-gradient(135deg, rgba(30,40,60,0.9), rgba(70,90,120,0.85))',
            color: 'white',
            cursor: busy ? 'wait' : 'pointer',
            minWidth: 140,
            fontWeight: 600
          }}
        >
          {busy ? 'Searching…' : 'Search knowledge'}
        </button>
      </form>
      {error && (
        <p role="alert" style={{ color: 'crimson' }}>
          {error}
        </p>
      )}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {hits.length === 0 && !busy && !error && <p style={{ opacity: 0.7 }}>No matches yet — run a query to explore the vault.</p>}
        {hits.map((hit) => (
          <article
            key={`${hit.knowledge_id}-${hit.chunk_ix}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              borderRadius: 16,
              border: '1px solid rgba(0,0,0,0.08)',
              background: 'rgba(20,20,30,0.04)',
              padding: '16px 18px'
            }}
          >
            <header style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <strong>{hit.title || hit.slug || 'Knowledge item'}</strong>
              <span style={{ fontSize: '0.85rem', opacity: 0.6 }}>Score {hit.score.toFixed(3)}</span>
            </header>
            <pre
              style={{
                margin: 0,
                whiteSpace: 'pre-wrap',
                fontSize: '0.95rem',
                lineHeight: 1.5,
                background: 'transparent'
              }}
            >
              {hit.content}
            </pre>
          </article>
        ))}
      </section>
    </main>
  );
}
