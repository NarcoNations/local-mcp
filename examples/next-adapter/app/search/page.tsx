'use client';

import { FormEvent, useState } from 'react';

type SearchHit = {
  knowledge_id: string;
  chunk_ix: number;
  content: string;
  score: number;
  knowledge?: { slug: string | null; title: string | null } | null;
};

type SearchResponse = {
  ok: boolean;
  hits: SearchHit[];
  durationMs: number;
};

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [duration, setDuration] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!q.trim()) {
      setError('Enter a query.');
      return;
    }
    setError(null);
    setLoading(true);
    setHits([]);
    setDuration(null);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: q.trim(), k: 12 })
      });
      if (!res.ok) throw new Error(await res.text());
      const json: SearchResponse = await res.json();
      setHits(json.hits || []);
      setDuration(json.durationMs ?? null);
    } catch (err: any) {
      setError(err?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ display: 'grid', gap: 24 }}>
      <header style={{ display: 'grid', gap: 8 }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>Semantic Search</h1>
        <p style={{ color: 'rgb(85, 85, 85)', maxWidth: 600 }}>
          Queries run against pgvector embeddings generated from your knowledge archives. Results include cosine similarity scores
          and provenance metadata.
        </p>
      </header>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
        <label style={{ display: 'grid', gap: 8 }}>
          <span style={{ fontWeight: 600 }}>Search query</span>
          <input
            type="text"
            name="q"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="How does VibeOS route LLM requests?"
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 10,
              border: '1px solid rgb(215, 215, 215)',
              fontSize: 15
            }}
          />
        </label>
        <button
          type="submit"
          disabled={isLoading}
          style={{
            padding: '12px 20px',
            borderRadius: 999,
            border: 'none',
            background: 'rgb(17, 17, 17)',
            color: 'rgb(255, 255, 255)',
            fontWeight: 600,
            fontSize: 14,
            justifySelf: 'flex-start'
          }}
        >
          {isLoading ? 'Searching…' : 'Search knowledge'}
        </button>
      </form>
      {error ? (
        <p role="alert" style={{ color: 'rgb(176, 0, 32)', fontWeight: 600 }}>{error}</p>
      ) : null}
      {typeof duration === 'number' ? (
        <p style={{ color: 'rgb(102, 102, 102)', fontSize: 13 }}>
          {hits.length} results in {Math.round(duration)} ms
        </p>
      ) : null}
      <section style={{ display: 'grid', gap: 16 }}>
        {hits.map((hit) => (
          <article
            key={`${hit.knowledge_id}-${hit.chunk_ix}`}
            style={{
              border: '1px solid rgb(229, 229, 229)',
              borderRadius: 14,
              padding: '18px 20px',
              background: 'rgb(255, 255, 255)'
            }}
          >
            <header style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'baseline' }}>
              <strong style={{ fontSize: 14, color: 'rgb(10, 124, 45)' }}>{hit.score.toFixed(3)}</strong>
              <span style={{ fontSize: 13, color: 'rgb(119, 119, 119)' }}>
                {hit.knowledge?.title || hit.knowledge?.slug || hit.knowledge_id} · chunk #{hit.chunk_ix}
              </span>
            </header>
            <p style={{ marginTop: 12, marginBottom: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{hit.content}</p>
          </article>
        ))}
        {!hits.length && !isLoading ? (
          <p style={{ color: 'rgb(119, 119, 119)' }}>No results yet — run a search after indexing knowledge.</p>
        ) : null}
      </section>
    </main>
  );
}
