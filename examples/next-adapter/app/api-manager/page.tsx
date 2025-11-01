'use client';

import { useState, type FormEvent } from 'react';

const providers = [
  { value: 'alpha-vantage', label: 'Alpha Vantage' },
  { value: 'finnhub', label: 'Finnhub' },
  { value: 'tiingo', label: 'Tiingo' },
];

const resources = [
  { value: 'quote', label: 'Quote' },
  { value: 'timeseries', label: 'Timeseries' },
  { value: 'company', label: 'Company' },
];

export default function ApiManagerPage() {
  const [provider, setProvider] = useState(providers[0].value);
  const [resource, setResource] = useState(resources[0].value);
  const [symbol, setSymbol] = useState('AAPL');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const params = new URLSearchParams({ symbol, resource });
      const res = await fetch(`/api/feeds/${provider}?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Request failed');
      }
      setResult(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--surface-base,#060608)] text-[var(--text-primary,#f5f5f5)]">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-12">
        <header className="flex flex-col gap-2">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--text-muted,#a1a1aa)]">VibeOS</p>
          <h1 className="text-3xl font-semibold md:text-4xl">API Manager</h1>
          <p className="max-w-2xl text-sm text-[var(--text-subtle,#d4d4d8)]">
            Multi-provider feeds with caching, rate-limit resilience, and DTO-normalised outputs. Use the
            playground below to inspect responses.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="flex w-full flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"
        >
          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-[var(--text-muted,#a1a1aa)]">Provider</span>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-base text-white outline-none focus:border-[var(--accent,#22d3ee)] focus:ring-2 focus:ring-[var(--accent,#22d3ee)]/40"
              >
                {providers.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span className="text-[var(--text-muted,#a1a1aa)]">Resource</span>
              <select
                value={resource}
                onChange={(e) => setResource(e.target.value)}
                className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-base text-white outline-none focus:border-[var(--accent,#22d3ee)] focus:ring-2 focus:ring-[var(--accent,#22d3ee)]/40"
              >
                {resources.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span className="text-[var(--text-muted,#a1a1aa)]">Symbol</span>
              <input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="AAPL"
                className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-base text-white outline-none focus:border-[var(--accent,#22d3ee)] focus:ring-2 focus:ring-[var(--accent,#22d3ee)]/40"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-full bg-[var(--accent,#22d3ee)] px-5 py-2 text-sm font-medium text-black transition hover:bg-[var(--accent-strong,#67e8f9)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent,#22d3ee)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Loading…' : 'Fetch feed'}
          </button>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
        </form>

        <section className="rounded-2xl border border-white/10 bg-black/30 p-6">
          <h2 className="text-lg font-semibold">Normalised response</h2>
          <pre className="mt-4 max-h-[420px] overflow-auto rounded-xl bg-black/70 p-4 text-xs leading-relaxed text-[var(--text-subtle,#d4d4d8)]">
            {result ? JSON.stringify(result, null, 2) : 'Run a request to view provider output.'}
          </pre>
        </section>
      </section>
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
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: '1.8rem'
};

const subtitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '1.3rem'
};

const leadStyle: CSSProperties = {
  margin: 0,
  color: 'rgba(0,0,0,0.65)',
  lineHeight: 1.6
};

const errorStyle: CSSProperties = {
  margin: 0,
  color: 'rgba(190,18,60,0.9)',
  fontWeight: 600
};

const formStyle: CSSProperties = {
  display: 'grid',
  gap: '12px',
  alignItems: 'start'
};

const labelStyle: CSSProperties = {
  display: 'grid',
  gap: '6px',
  fontWeight: 600
};

const inputStyle: CSSProperties = {
  padding: '10px',
  borderRadius: '10px',
  border: '1px solid rgba(15,23,42,0.12)',
  background: 'rgba(248,250,252,0.9)'
};

const selectStyle: CSSProperties = { ...inputStyle };

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

const preStyle: CSSProperties = {
  background: 'rgba(15,23,42,0.07)',
  borderRadius: '12px',
  padding: '16px',
  margin: 0,
  maxHeight: '320px',
  overflow: 'auto',
  fontSize: '0.85rem',
  lineHeight: 1.5
};

const llmResultStyle: CSSProperties = {
  display: 'grid',
  gap: '8px'
};
