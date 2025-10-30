'use client';
import { useState, type FormEvent } from 'react';

type SearchResult = {
  knowledge_id: string;
  slug?: string | null;
  title?: string | null;
  chunk_ix: number;
  content: string;
  score: number;
};

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!query.trim()) {
      setError('Enter a query to search.');
      return;
    }
    setBusy(true);
    setError(null);
    setResults([]);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: query.trim() })
      });
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as { results: SearchResult[] };
      setResults(json.results || []);
    } catch (err: any) {
      setError(err?.message || 'Search failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ margin: 0 }}>Semantic Search</h1>
        <p style={{ margin: 0, maxWidth: 640, color: 'rgba(0,0,0,0.65)' }}>
          Embed queries locally (MiniLM) and rank against indexed knowledge chunks using cosine similarity.
        </p>
      </header>
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'grid',
          gap: '12px',
          padding: 'clamp(16px, 4vw, 28px)',
          borderRadius: '16px',
          border: '1px solid rgba(0,0,0,0.08)',
          background: 'rgba(255,255,255,0.92)'
        }}
      >
        <label style={{ display: 'grid', gap: '8px', fontWeight: 600 }}>
          Query
          <textarea
            name="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={3}
            placeholder="e.g. Vector stores for research workflows"
            style={{
              padding: '12px',
              borderRadius: '12px',
              border: '1px solid rgba(0,0,0,0.2)',
              background: 'rgba(255,255,255,0.9)',
              resize: 'vertical'
            }}
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          style={{
            padding: '12px 18px',
            borderRadius: '12px',
            border: 'none',
            background: busy ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.85)',
            color: 'rgb(255,255,255)',
            fontWeight: 600,
            cursor: busy ? 'progress' : 'pointer'
          }}
        >
          {busy ? 'Searching…' : 'Search knowledge'}
        </button>
        {error && <p style={{ margin: 0, color: 'rgb(180,0,0)' }}>{error}</p>}
      </form>
      <section style={{ display: 'grid', gap: '16px' }}>
        {results.map((item, idx) => (
          <article
            key={`${item.knowledge_id}-${item.chunk_ix}-${idx}`}
            style={{
              borderRadius: '16px',
              border: '1px solid rgba(0,0,0,0.08)',
              background: 'rgba(255,255,255,0.96)',
              padding: '20px',
              display: 'grid',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <strong>{item.title || item.slug || item.knowledge_id}</strong>
              <span style={{ fontSize: '0.85rem', color: 'rgba(0,0,0,0.6)' }}>
                Score {(item.score || 0).toFixed(3)} · chunk #{item.chunk_ix}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.6 }}>
              {truncateContent(item.content)}
            </p>
          </article>
        ))}
        {!results.length && !busy && !error && (
          <p style={{ margin: 0, color: 'rgba(0,0,0,0.6)' }}>
            Results will appear here once you run a search.
          </p>
        )}
      </section>
    </div>
  );
}

function truncateContent(text: string, limit = 320) {
  if (!text) return '';
  if (text.length <= limit) return text;
  return text.slice(0, limit).trimEnd() + '…';
}
