'use client';
import { useState, type CSSProperties, type FormEvent } from 'react';

type ResearchResult = {
  ok?: boolean;
  plan?: { step: number; action: string; notes: string }[];
  results?: {
    facts: string[];
    insights: string[];
    sources: { label: string; href: string }[];
  };
};

export default function ResearchPage() {
  const [query, setQuery] = useState('What are the next milestones for VibeOS M1?');
  const [objectives, setObjectives] = useState('Highlight ingest throughput, embedding health, and UI readiness.');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResearchResult | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/research/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, objectives })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Research run failed');
      setResult(json);
    } catch (err: any) {
      setError(err?.message || 'Research run failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={mainStyle}>
      <section style={cardStyle}>
        <h1 style={titleStyle}>Research Engine</h1>
        <p style={leadStyle}>
          Define a query and objectives. The engine drafts a plan, surfaces facts, and links recommended sources.
        </p>
        <form onSubmit={handleSubmit} style={formStyle}>
          <label style={labelStyle}>
            Query
            <input value={query} onChange={(event) => setQuery(event.currentTarget.value)} style={inputStyle} />
          </label>
          <label style={labelStyle}>
            Objectives
            <textarea value={objectives} onChange={(event) => setObjectives(event.currentTarget.value)} rows={4} style={textareaStyle} />
          </label>
          <button type="submit" style={buttonStyle} disabled={loading}>
            {loading ? 'Running…' : 'Run research pass'}
          </button>
        </form>
        {error && <p style={errorStyle}>{error}</p>}
      </section>

      {result && (
        <section style={cardStyle}>
          <h2 style={subtitleStyle}>Plan</h2>
          <ol style={planStyle}>
            {(result.plan || []).map((item) => (
              <li key={item.step}>
                <strong>{item.action}</strong>
                <p style={metaStyle}>{item.notes}</p>
              </li>
            ))}
          </ol>
          <div style={insightsGridStyle}>
            <div>
              <h3 style={subtitleStyle}>Facts</h3>
              <ul style={listStyle}>{(result.results?.facts || []).map((fact, idx) => <li key={idx}>{fact}</li>)}</ul>
            </div>
            <div>
              <h3 style={subtitleStyle}>Insights</h3>
              <ul style={listStyle}>{(result.results?.insights || []).map((insight, idx) => <li key={idx}>{insight}</li>)}</ul>
            </div>
            <div>
              <h3 style={subtitleStyle}>Sources</h3>
              <ul style={listStyle}>
                {(result.results?.sources || []).map((source) => (
                  <li key={source.href}>
                    <a href={source.href} style={linkStyle}>
                      {source.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

const mainStyle: CSSProperties = {
  display: 'grid',
  gap: '24px',
  padding: '24px 0'
};

const cardStyle: CSSProperties = {
  background: 'rgb(255,255,255)',
  borderRadius: '16px',
  padding: '24px',
  boxShadow: '0 12px 32px rgba(15,23,42,0.08)',
  display: 'grid',
  gap: '16px'
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: '1.8rem'
};

const subtitleStyle: CSSProperties = {
  margin: '0 0 8px 0',
  fontSize: '1.1rem'
};

const leadStyle: CSSProperties = {
  margin: 0,
  color: 'rgba(0,0,0,0.65)',
  lineHeight: 1.6
};

const formStyle: CSSProperties = {
  display: 'grid',
  gap: '16px'
};

const labelStyle: CSSProperties = {
  display: 'grid',
  gap: '8px',
  fontWeight: 600
};

const inputStyle: CSSProperties = {
  padding: '10px',
  borderRadius: '10px',
  border: '1px solid rgba(15,23,42,0.12)',
  background: 'rgba(248,250,252,0.9)'
};

const textareaStyle: CSSProperties = {
  ...inputStyle,
  resize: 'vertical'
};

const buttonStyle: CSSProperties = {
  padding: '12px 20px',
  borderRadius: '999px',
  border: 'none',
  background: 'rgba(37,99,235,0.85)',
  color: 'white',
  fontWeight: 600,
  cursor: 'pointer'
};

const errorStyle: CSSProperties = {
  margin: 0,
  color: 'rgba(190,18,60,0.9)',
  fontWeight: 600
};

const planStyle: CSSProperties = {
  margin: 0,
  padding: '0 0 0 16px',
  display: 'grid',
  gap: '12px'
};

const metaStyle: CSSProperties = {
  margin: '4px 0 0 0',
  color: 'rgba(0,0,0,0.6)'
};

const insightsGridStyle: CSSProperties = {
  display: 'grid',
  gap: '16px',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))'
};

const listStyle: CSSProperties = {
  margin: 0,
  padding: '0 0 0 16px',
  display: 'grid',
  gap: '8px'
};

const linkStyle: CSSProperties = {
  color: 'rgba(37,99,235,0.95)',
  fontWeight: 600
};
