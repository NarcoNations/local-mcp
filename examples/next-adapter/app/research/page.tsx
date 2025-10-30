'use client';

import { FormEvent, useState } from 'react';

type ResearchSection = {
  facts: string[];
  insights: string[];
  sources: { title: string; url: string }[];
};

type ResearchResponse = {
  ok: boolean;
  sections: ResearchSection;
  durationMs?: number;
};

export default function ResearchPage() {
  const [query, setQuery] = useState('How does VibeOS ingest documents into the knowledge base?');
  const [objectives, setObjectives] = useState('Identify ingestion steps, storage targets, and follow-up automation ideas.');
  const [result, setResult] = useState<ResearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(false);

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
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setResult(json);
    } catch (err: any) {
      setError(err?.message || 'Research run failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ display: 'grid', gap: 24 }}>
      <header style={{ display: 'grid', gap: 8 }}>
        <h1 style={{ margin: 0, fontSize: 30 }}>Research Engine</h1>
        <p style={{ color: 'rgb(85, 85, 85)', maxWidth: 720 }}>
          Draft research plans with structured output (Facts, Insights, Sources). The current implementation uses a stubbed
          response so you can verify the workflow before integrating live research agents.
        </p>
      </header>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
        <label style={{ display: 'grid', gap: 8 }}>
          <span style={{ fontWeight: 600 }}>Research query</span>
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            required
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              border: '1px solid rgb(215, 215, 215)',
              fontSize: 15
            }}
          />
        </label>
        <label style={{ display: 'grid', gap: 8 }}>
          <span style={{ fontWeight: 600 }}>Objectives</span>
          <textarea
            value={objectives}
            onChange={(event) => setObjectives(event.target.value)}
            rows={4}
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              border: '1px solid rgb(215, 215, 215)',
              resize: 'vertical',
              fontFamily: 'inherit'
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
            justifySelf: 'flex-start'
          }}
        >
          {isLoading ? 'Planning…' : 'Run research'}
        </button>
      </form>
      {error ? <p role="alert" style={{ color: 'rgb(176, 0, 32)', fontWeight: 600 }}>{error}</p> : null}
      {result ? (
        <section style={{ display: 'grid', gap: 20 }}>
          <strong style={{ fontSize: 13, color: 'rgb(10, 124, 45)' }}>
            Stubbed plan — {result.sections.facts.length} facts · {result.sections.insights.length} insights ·{' '}
            {result.sections.sources.length} sources
          </strong>
          <div style={{ display: 'grid', gap: 16 }}>
            <Card title="Facts" items={result.sections.facts} color="rgb(17, 17, 17)" />
            <Card title="Insights" items={result.sections.insights} color="rgb(10, 124, 45)" />
            <SourcesCard sources={result.sections.sources} />
          </div>
        </section>
      ) : null}
    </main>
  );
}

function Card({ title, items, color }: { title: string; items: string[]; color: string }) {
  if (!items.length) return null;
  return (
    <article
      style={{
        border: '1px solid rgb(229, 229, 229)',
        borderRadius: 16,
        padding: '20px 24px',
        display: 'grid',
        gap: 10
      }}
    >
      <h2 style={{ margin: 0, fontSize: 20, color }}>{title}</h2>
      <ul style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 6 }}>
        {items.map((item, idx) => (
          <li key={idx} style={{ lineHeight: 1.6 }}>{item}</li>
        ))}
      </ul>
    </article>
  );
}

function SourcesCard({ sources }: { sources: { title: string; url: string }[] }) {
  if (!sources.length) return null;
  return (
    <article
      style={{
        border: '1px solid rgb(229, 229, 229)',
        borderRadius: 16,
        padding: '20px 24px',
        display: 'grid',
        gap: 10
      }}
    >
      <h2 style={{ margin: 0, fontSize: 20 }}>Sources</h2>
      <ul style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 6 }}>
        {sources.map((source, idx) => (
          <li key={idx}>
            <a href={source.url} target="_blank" rel="noreferrer" style={{ color: 'rgb(10, 124, 45)' }}>
              {source.title}
            </a>
          </li>
        ))}
      </ul>
    </article>
  );
}
