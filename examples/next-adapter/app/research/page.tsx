'use client';
import { useState, type CSSProperties } from 'react';

type ResearchResponse = {
  ok: boolean;
  sections: {
    facts: string[];
    insights: string[];
    sources: { title: string; url: string }[];
  };
};

export default function ResearchPage() {
  const [query, setQuery] = useState('How does VibeOS support knowledge ingest?');
  const [objectives, setObjectives] = useState('Outline key capabilities, note integration risks, suggest next steps.');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResearchResponse['sections'] | null>(null);

  async function runResearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!query.trim()) {
      setError('Enter a research query.');
      return;
    }
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/research/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), objectives: objectives.trim() })
      });
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as ResearchResponse;
      setResult(json.sections);
    } catch (err: any) {
      setError(err?.message || 'Research run failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ padding: 'min(4vw, 32px)', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ fontSize: 'clamp(1.75rem, 2.5vw, 2.5rem)', margin: 0 }}>Research Engine</h1>
        <p style={{ maxWidth: 760, lineHeight: 1.5 }}>
          Spin up structured intelligence packets. Provide a query and objectives; the backend will synthesise facts, insights,
          and recommended sources.
        </p>
      </header>
      <form onSubmit={runResearch} style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 720 }}>
        <label style={labelStyle}>
          Query
          <input value={query} onChange={(e) => setQuery(e.target.value)} style={inputStyle} />
        </label>
        <label style={labelStyle}>
          Objectives
          <textarea
            value={objectives}
            onChange={(e) => setObjectives(e.target.value)}
            rows={4}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </label>
        <button type="submit" disabled={busy} style={buttonStyle}>
          {busy ? 'Assembling…' : 'Run research pass'}
        </button>
      </form>
      {error && (
        <p role="alert" style={{ color: 'crimson' }}>
          {error}
        </p>
      )}
      {result && (
        <section style={{ display: 'grid', gap: 18, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          <div style={cardStyle}>
            <h2 style={sectionTitle}>Facts</h2>
            <ul style={listStyle}>
              {result.facts.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
          <div style={cardStyle}>
            <h2 style={sectionTitle}>Insights</h2>
            <ul style={listStyle}>
              {result.insights.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
          <div style={cardStyle}>
            <h2 style={sectionTitle}>Sources</h2>
            <ul style={listStyle}>
              {result.sources.map((source, idx) => (
                <li key={idx}>
                  <a href={source.url} target="_blank" rel="noreferrer">
                    {source.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </main>
  );
}

const labelStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 600 };
const inputStyle: CSSProperties = { padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.15)' };
const buttonStyle: CSSProperties = {
  alignSelf: 'flex-start',
  padding: '10px 18px',
  borderRadius: 999,
  border: 'none',
  background: 'linear-gradient(135deg, rgba(30,40,60,0.9), rgba(70,90,120,0.85))',
  color: 'white',
  cursor: 'pointer',
  fontWeight: 600
};
const cardStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  borderRadius: 18,
  border: '1px solid rgba(0,0,0,0.08)',
  background: 'rgba(20,20,30,0.04)',
  padding: '16px 18px'
};
const listStyle: CSSProperties = { margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 };
const sectionTitle: CSSProperties = { margin: 0 };
