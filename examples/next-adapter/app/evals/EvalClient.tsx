'use client';

import { useState, useTransition } from 'react';

const API_HEADERS = process.env.NEXT_PUBLIC_DEMO_API_KEY
  ? { 'x-api-key': process.env.NEXT_PUBLIC_DEMO_API_KEY }
  : undefined;

export function EvalClient({ datasets }: { datasets: string[] }) {
  const [dataset, setDataset] = useState(datasets[0] ?? 'baseline-qa');
  const [models, setModels] = useState('openai:gpt-4o,anthropic:claude-3-haiku');
  const [result, setResult] = useState<any>(null);
  const [isPending, startTransition] = useTransition();

  const run = () => {
    startTransition(async () => {
      setResult(null);
      const payload = {
        dataset,
        models: models
          .split(',')
          .map((m) => m.trim())
          .filter(Boolean),
      };
      const res = await fetch('/api/evals/run', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(API_HEADERS ?? {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        setResult({ error: text });
        return;
      }
      const json = await res.json();
      setResult(json.result);
    });
  };

  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        border: '1px solid var(--foreground-200,#e5e7eb)',
        borderRadius: 12,
        padding: 16,
        background: 'var(--background-elevated, rgba(255,255,255,0.9))',
      }}
    >
      <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Run Eval</h2>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span>Dataset</span>
        <select value={dataset} onChange={(e) => setDataset(e.target.value)} style={{ padding: '8px 10px' }}>
          {datasets.map((key) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </select>
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span>Models (comma separated)</span>
        <input
          value={models}
          onChange={(e) => setModels(e.target.value)}
          style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--foreground-200,#e5e7eb)' }}
        />
      </label>
      <button
        type="button"
        onClick={run}
        disabled={isPending}
        style={{
          padding: '10px 14px',
          borderRadius: 999,
          border: 'none',
          background: 'var(--accent-600,#0ea5e9)',
          color: 'white',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {isPending ? 'Running…' : 'Run Evaluation'}
      </button>
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {'error' in result ? (
            <p style={{ color: 'var(--danger-600,#dc2626)' }}>Error: {result.error}</p>
          ) : (
            result.results?.map((row: any) => (
              <article
                key={row.model}
                style={{
                  border: '1px solid var(--foreground-100,#f3f4f6)',
                  borderRadius: 10,
                  padding: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <strong>{row.model}</strong>
                <span>Exact: {(row.metrics.exact * 100).toFixed(1)}%</span>
                <span>BLEU-ish: {(row.metrics.bleuish * 100).toFixed(1)}%</span>
                <span>Latency avg: {row.metrics.avgLatency.toFixed(1)} ms</span>
              </article>
            ))
          )}
        </div>
      )}
    </section>
  );
}
