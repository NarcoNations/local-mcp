'use client';
import { useState, type FormEvent } from 'react';

type ResearchResult = { ok: boolean; facts: string[]; insights: string[]; sources: { title: string; url: string }[] };

export default function ResearchPage() {
  const [query, setQuery] = useState('');
  const [objectives, setObjectives] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResearchResult | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!query.trim()) {
      setError('Enter a research query to explore.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/research/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, objectives })
      });
      const json = (await res.json()) as ResearchResult;
      if (!res.ok || !json.ok) throw new Error('Research runner failed');
      setResult(json);
    } catch (err: any) {
      setError(err?.message || 'Research runner failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ margin: 0 }}>Research Engine</h1>
        <p style={{ margin: 0, maxWidth: 720, color: 'rgba(0,0,0,0.65)' }}>
          Outline your question and objectives. The engine returns stubbed facts, insights, and sources ready for refinement.
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
        <label style={{ display: 'grid', gap: '6px', fontWeight: 600 }}>
          Research query
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Supabase + pgvector best practices"
            style={{
              padding: '12px',
              borderRadius: '12px',
              border: '1px solid rgba(0,0,0,0.2)',
              background: 'rgba(255,255,255,0.9)'
            }}
          />
        </label>
        <label style={{ display: 'grid', gap: '6px', fontWeight: 600 }}>
          Objectives
          <textarea
            value={objectives}
            onChange={(e) => setObjectives(e.target.value)}
            rows={4}
            placeholder="Key deliverables, stakeholders, formats..."
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
          disabled={loading}
          style={{
            padding: '12px 18px',
            borderRadius: '12px',
            border: 'none',
            background: loading ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.85)',
            color: 'rgb(255,255,255)',
            fontWeight: 600,
            cursor: loading ? 'progress' : 'pointer'
          }}
        >
          {loading ? 'Synthesising…' : 'Run research stub'}
        </button>
        {error && <p style={{ margin: 0, color: 'rgb(180,0,0)' }}>{error}</p>}
      </form>
      {result && (
        <section
          style={{
            display: 'grid',
            gap: '16px',
            borderRadius: '16px',
            border: '1px solid rgba(0,0,0,0.08)',
            background: 'rgba(255,255,255,0.96)',
            padding: '20px'
          }}
        >
          <div style={{ display: 'grid', gap: '8px' }}>
            <h2 style={{ margin: 0 }}>Facts</h2>
            <ul style={{ margin: 0, paddingLeft: '20px', display: 'grid', gap: '6px' }}>
              {result.facts.map((fact, idx) => (
                <li key={idx} style={{ lineHeight: 1.5 }}>
                  {fact}
                </li>
              ))}
            </ul>
          </div>
          <div style={{ display: 'grid', gap: '8px' }}>
            <h2 style={{ margin: 0 }}>Insights</h2>
            <ul style={{ margin: 0, paddingLeft: '20px', display: 'grid', gap: '6px' }}>
              {result.insights.map((insight, idx) => (
                <li key={idx} style={{ lineHeight: 1.5 }}>
                  {insight}
                </li>
              ))}
            </ul>
          </div>
          <div style={{ display: 'grid', gap: '8px' }}>
            <h2 style={{ margin: 0 }}>Sources</h2>
            <ul style={{ margin: 0, paddingLeft: '20px', display: 'grid', gap: '6px' }}>
              {result.sources.map((source, idx) => (
                <li key={idx} style={{ lineHeight: 1.5 }}>
                  <a href={source.url} style={{ color: 'rgba(0,0,0,0.75)' }}>
                    {source.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
