'use client';
import { useState, type CSSProperties, type FormEvent } from 'react';

type SearchResult = {
  knowledge_id: string;
  slug: string | null;
  title: string | null;
  chunk_ix: number;
  content: string;
  score: number;
};

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: query.trim(), k: 12 })
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setResults(json.results || []);
    } catch (err: any) {
      setError(err?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={mainStyle}>
      <section style={cardStyle}>
        <h1 style={titleStyle}>Vector Search</h1>
        <p style={leadStyle}>
          Embed queries locally with MiniLM and score against your indexed knowledge base. Results include chunk metadata and
          inline previews.
        </p>
        <form onSubmit={handleSubmit} style={formStyle}>
          <label style={labelStyle}>
            <span>Query</span>
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder="Explain VibeOS architecture"
              style={inputStyle}
              required
            />
          </label>
          <button type="submit" style={buttonStyle} disabled={loading}>
            {loading ? 'Searching…' : 'Run search'}
          </button>
        </form>
        {error && <p style={errorStyle}>{error}</p>}
      </section>

      <section style={cardStyle}>
        <h2 style={subtitleStyle}>Results</h2>
        {results.length === 0 && !loading && <p style={{ margin: 0 }}>No matches yet. Index knowledge and try again.</p>}
        <div style={resultGridStyle}>
          {results.map((result) => (
            <article key={`${result.knowledge_id}-${result.chunk_ix}`} style={resultItemStyle}>
              <header>
                <strong>{result.title || result.slug || result.knowledge_id}</strong>
                <p style={resultMetaStyle}>
                  chunk #{result.chunk_ix} · score {(result.score || 0).toFixed(3)}
                </p>
              </header>
              <p style={snippetStyle}>{result.content.slice(0, 500)}{result.content.length > 500 ? '…' : ''}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

const mainStyle: CSSProperties = {
  display: 'grid',
  gap: '24px',
  padding: '24px 0',
};

const cardStyle: CSSProperties = {
  background: 'rgb(255,255,255)',
  borderRadius: '16px',
  padding: '24px',
  boxShadow: '0 12px 32px rgba(15,23,42,0.08)',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: '1.75rem',
};

const subtitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '1.3rem',
};

const leadStyle: CSSProperties = {
  margin: 0,
  color: 'rgba(0,0,0,0.65)',
  lineHeight: 1.6,
};

const formStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const labelStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  fontWeight: 600,
};

const inputStyle: CSSProperties = {
  padding: '10px',
  borderRadius: '10px',
  border: '1px solid rgba(15,23,42,0.12)',
  background: 'rgba(248,250,252,0.9)',
};

const buttonStyle: CSSProperties = {
  padding: '12px 20px',
  borderRadius: '999px',
  border: 'none',
  background: 'rgba(37,99,235,0.85)',
  color: 'white',
  fontWeight: 600,
  cursor: 'pointer',
};

const errorStyle: CSSProperties = {
  margin: 0,
  color: 'rgba(190,18,60,0.9)',
  fontWeight: 600,
};

const resultGridStyle: CSSProperties = {
  display: 'grid',
  gap: '16px',
};

const resultItemStyle: CSSProperties = {
  background: 'rgba(15,23,42,0.05)',
  borderRadius: '16px',
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const resultMetaStyle: CSSProperties = {
  margin: 0,
  color: 'rgba(0,0,0,0.6)',
  fontSize: '0.9rem',
};

const snippetStyle: CSSProperties = {
  margin: 0,
  lineHeight: 1.5,
  whiteSpace: 'pre-wrap',
};
