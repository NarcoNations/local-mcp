'use client';

import { useState } from 'react';

import type { EvalDefinition } from '@/examples/next-adapter/lib/evals';

type Props = {
  evals: EvalDefinition[];
};

const defaultModels = ['gpt-4.1-mini', 'claude-3-haiku'];

export default function EvalRunner({ evals }: Props) {
  const [selectedEval, setSelectedEval] = useState(evals[0]?.id ?? '');
  const [models, setModels] = useState(defaultModels.join('\n'));
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function triggerRun() {
    setLoading(true);
    setStatus(null);
    setError(null);
    try {
      const res = await fetch('/api/evals/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_DEMO_KEY || 'demo-key',
        },
        body: JSON.stringify({ eval_id: selectedEval, models: models.split('\n').map((m) => m.trim()).filter(Boolean) }),
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = await res.json();
      setStatus(`Queued ${data.runs.length} runs. Refresh leaderboard to view.`);
    } catch (err: any) {
      setError(err?.message || 'Failed to start evals');
    } finally {
      setLoading(false);
    }
  }

  if (evals.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-stone-800 bg-stone-950/70 p-6">
      <header className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-stone-100">Run new evaluation</h2>
        <p className="text-xs text-stone-500">
          Provide models separated by new lines. Uses mock scoring while router wiring lands.
        </p>
      </header>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-stone-300">Eval set</span>
          <select
            className="rounded-lg border border-stone-800 bg-stone-900/80 px-3 py-2 text-stone-100 focus:border-emerald-500 focus:outline-none"
            value={selectedEval}
            onChange={(e) => setSelectedEval(e.target.value)}
          >
            {evals.map((definition) => (
              <option key={definition.id} value={definition.id}>
                {definition.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-stone-300">Models</span>
          <textarea
            className="min-h-[120px] rounded-lg border border-stone-800 bg-stone-900/80 px-3 py-2 text-stone-100 focus:border-emerald-500 focus:outline-none"
            value={models}
            onChange={(e) => setModels(e.target.value)}
          />
        </label>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-stone-900 shadow-lg transition hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
          onClick={triggerRun}
          disabled={loading}
        >
          {loading ? 'Running…' : 'Run eval'}
        </button>
        {status && <p className="text-xs text-emerald-300">{status}</p>}
        {error && <p className="text-xs text-rose-300">{error}</p>}
      </div>
    </section>
  );
}
