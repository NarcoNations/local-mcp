'use client';

import { useState } from 'react';

export default function ResearchPage() {
  const [query, setQuery] = useState('Narco Nations maritime corridors');
  const [objectiveInput, setObjectiveInput] = useState('Map free-tier data feeds\nFlag supply chokepoints');
  const [mode, setMode] = useState<'academic' | 'narrative'>('academic');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function runResearch() {
    setLoading(true);
    setError(null);
    try {
      const objectives = objectiveInput
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
      const res = await fetch('/api/research/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, objectives, mode }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Research run failed');
      setResult(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Research run failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--surface-base,#040507)] text-[var(--text-primary,#f5f5f5)]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-12">
        <header className="flex flex-col gap-2">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--text-muted,#a1a1aa)]">Research Engine</p>
          <h1 className="text-3xl font-semibold md:text-4xl">Plan → Notes → Export</h1>
          <p className="max-w-3xl text-sm text-[var(--text-subtle,#d4d4d8)]">
            Outline objectives, run the LLM router, and capture structured facts and insights ready for Obsidian or Knowledge
            base export.
          </p>
        </header>

        <section className="rounded-2xl border border-white/10 bg-black/30 p-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-[var(--text-muted,#a1a1aa)]">Primary query</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-base focus:border-[var(--accent,#22d3ee)] focus:outline-none focus:ring-2 focus:ring-[var(--accent,#22d3ee)]/40"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-[var(--text-muted,#a1a1aa)]">Mode</span>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as 'academic' | 'narrative')}
                className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-base focus:border-[var(--accent,#22d3ee)] focus:outline-none focus:ring-2 focus:ring-[var(--accent,#22d3ee)]/40"
              >
                <option value="academic">Academic</option>
                <option value="narrative">Narrative</option>
              </select>
            </label>
          </div>

          <label className="mt-4 flex flex-col gap-2 text-sm">
            <span className="text-[var(--text-muted,#a1a1aa)]">Objectives (one per line)</span>
            <textarea
              value={objectiveInput}
              onChange={(e) => setObjectiveInput(e.target.value)}
              rows={4}
              className="rounded-xl border border-white/10 bg-black/40 p-3 text-sm focus:border-[var(--accent,#22d3ee)] focus:outline-none focus:ring-2 focus:ring-[var(--accent,#22d3ee)]/40"
            />
          </label>

          <button
            onClick={runResearch}
            disabled={loading}
            className="mt-4 inline-flex items-center justify-center rounded-full bg-[var(--accent,#22d3ee)] px-5 py-2 text-sm font-semibold text-black transition hover:bg-[var(--accent-strong,#67e8f9)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Running…' : 'Run research engine'}
          </button>
          {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
        </section>

        {result ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-white/10 bg-black/30 p-6">
              <h2 className="text-lg font-semibold">Plan</h2>
              <ol className="mt-4 space-y-3 text-sm text-[var(--text-subtle,#d4d4d8)]">
                {result.plan.map((step: any) => (
                  <li key={step.id} className="rounded-xl border border-white/10 bg-black/40 p-3">
                    <p className="text-sm font-semibold text-white">{step.title}</p>
                    <p className="text-xs leading-relaxed text-[var(--text-muted,#a1a1aa)]">{step.detail}</p>
                  </li>
                ))}
              </ol>
            </section>

            <section className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/30 p-6">
              <div>
                <h2 className="text-lg font-semibold">Insights</h2>
                <ul className="mt-3 space-y-3 text-sm text-[var(--text-subtle,#d4d4d8)]">
                  {result.insights.map((insight: any) => (
                    <li key={insight.id} className="rounded-xl border border-white/10 bg-black/40 p-3">
                      <p className="text-sm font-semibold text-white">{insight.headline}</p>
                      <p className="text-xs text-[var(--text-muted,#a1a1aa)]">{insight.impact}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className="text-lg font-semibold">Facts</h2>
                <ul className="mt-3 space-y-3 text-sm text-[var(--text-subtle,#d4d4d8)]">
                  {result.facts.map((fact: any) => (
                    <li key={fact.id} className="rounded-xl border border-white/10 bg-black/40 p-3">
                      {fact.statement}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="lg:col-span-2 rounded-2xl border border-white/10 bg-black/30 p-6">
              <h2 className="text-lg font-semibold">Sources</h2>
              <ul className="mt-3 grid gap-3 text-sm text-[var(--text-subtle,#d4d4d8)] md:grid-cols-2">
                {result.sources.map((source: any) => (
                  <li key={source.url} className="rounded-xl border border-white/10 bg-black/40 p-3">
                    <p className="text-sm font-semibold text-white">{source.title}</p>
                    <a className="text-xs text-[var(--accent,#22d3ee)] underline" href={source.url}>
                      {source.url}
                    </a>
                    <p className="text-xs text-[var(--text-muted,#a1a1aa)]">Confidence: {source.confidence}</p>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        ) : null}
      </div>
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
