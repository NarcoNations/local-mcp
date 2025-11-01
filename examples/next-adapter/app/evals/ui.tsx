'use client';

import { useMemo, useState } from 'react';
import type { EvalDataset } from '@/examples/next-adapter/lib/evals/datasets';

interface Props {
  datasets: EvalDataset[];
  enabled: boolean;
}

const DEFAULT_MODELS = ['gpt-4o-mini', 'local:mock'];

export default function EvalLab({ datasets, enabled }: Props) {
  const [datasetId, setDatasetId] = useState(datasets[0]?.id ?? '');
  const [models, setModels] = useState(DEFAULT_MODELS.join(', '));
  const [loading, setLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const dataset = useMemo(() => datasets.find((d) => d.id === datasetId), [datasets, datasetId]);

  async function runEval() {
    if (!datasetId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/evals/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datasetId, models: models.split(',').map((m) => m.trim()).filter(Boolean) }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Eval failed');
      }
      setLeaderboard(json.leaderboard || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!enabled) {
    return (
      <main style={{ padding: '48px 0', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600 }}>Eval Lab</h1>
        <p style={{ color: '#666' }}>Set FF_EVALS=true to enable automated evaluations.</p>
      </main>
    );
  }

  return (
    <main style={{ display: 'grid', gap: 24 }}>
      <header style={{ display: 'grid', gap: 8 }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600 }}>Eval Lab</h1>
        <p style={{ color: '#555' }}>
          Compare LLM outputs across curated datasets. Results are logged to Supabase for historical analysis.
        </p>
      </header>

      <section
        style={{
          display: 'grid',
          gap: 16,
          padding: 16,
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          background: '#f8fafc',
        }}
      >
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontWeight: 600 }}>Dataset</span>
          <select
            value={datasetId}
            onChange={(event) => setDatasetId(event.target.value)}
            style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5f5' }}
          >
            {datasets.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontWeight: 600 }}>Models (comma separated)</span>
          <input
            type="text"
            value={models}
            onChange={(event) => setModels(event.target.value)}
            style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5f5' }}
            placeholder="gpt-4o-mini, local:mock"
          />
        </label>

        <button
          onClick={runEval}
          disabled={loading}
          style={{
            padding: '12px 18px',
            borderRadius: 10,
            border: 'none',
            background: loading ? '#cbd5f5' : '#101820',
            color: '#fff',
            fontWeight: 600,
            cursor: loading ? 'wait' : 'pointer',
          }}
        >
          {loading ? 'Running…' : 'Run Evaluation'}
        </button>
        {dataset && <p style={{ color: '#4a5568' }}>{dataset.description}</p>}
        {error && <p style={{ color: '#c53030' }}>{error}</p>}
      </section>

      <section style={{ display: 'grid', gap: 16 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Leaderboard</h2>
        <div
          style={{
            display: 'grid',
            gap: 16,
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          }}
        >
          {leaderboard.map((entry) => (
            <article
              key={entry.runId}
              style={{
                border: '1px solid #101820',
                borderRadius: 12,
                padding: 16,
                background: '#0b1220',
                color: '#e2f0ff',
                display: 'grid',
                gap: 8,
              }}
            >
              <header>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{entry.model}</h3>
              </header>
              <p>Accuracy: {(entry.metrics.accuracy * 100).toFixed(1)}%</p>
              <p>Coverage: {(entry.metrics.coverage * 100).toFixed(1)}%</p>
              <p>Avg Latency: {entry.metrics.avgLatencyMs} ms</p>
              <p>Avg Length Δ: {entry.metrics.avgLengthDelta.toFixed(1)}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
