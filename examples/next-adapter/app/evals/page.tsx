'use client';

import { useMemo, useState } from 'react';
import { listDatasets } from '@/examples/next-adapter/lib/evals/engine';

interface ModelResult {
  model: string;
  metrics: Record<string, number>;
  responses: { prompt: string; expected: string; actual: string; latency_ms: number }[];
}

export default function EvalPage() {
  const datasets = useMemo(() => listDatasets(), []);
  const [selectedDataset, setSelectedDataset] = useState(datasets[0]?.id ?? 'baseline.qa');
  const [models, setModels] = useState('gpt-4o-mini, anthropic/claude-3-haiku');
  const [results, setResults] = useState<ModelResult[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runEvalRequest() {
    setRunning(true);
    setError(null);
    setResults([]);
    const modelList = models
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean);
    const res = await fetch('/api/evals/run', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(process.env.NEXT_PUBLIC_DEMO_API_KEY ? { 'x-api-key': process.env.NEXT_PUBLIC_DEMO_API_KEY } : {}),
      },
      body: JSON.stringify({ datasetId: selectedDataset, models: modelList }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? 'Eval failed');
    } else {
      setResults(json.modelResults ?? []);
    }
    setRunning(false);
  }

  return (
    <main className="px-4 py-6 lg:py-10">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold">Eval Lab</h1>
          <p className="text-sm text-neutral-500">
            Benchmark prompts and models across curated datasets. Toggle FF_EVALS to unlock advanced datasets.
          </p>
        </header>

        <section className="rounded-xl border border-neutral-200 bg-white/70 p-5 shadow-sm backdrop-blur">
          <h2 className="text-lg font-medium">Run an Evaluation</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase text-neutral-500">Dataset</label>
              <select
                value={selectedDataset}
                onChange={(event) => setSelectedDataset(event.target.value)}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              >
                {datasets.map((dataset) => (
                  <option key={dataset.id} value={dataset.id}>
                    {dataset.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase text-neutral-500">Models</label>
              <input
                value={models}
                onChange={(event) => setModels(event.target.value)}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
              <span className="text-xs text-neutral-400">Comma-separated identifiers routed via the LLM router.</span>
            </div>
          </div>
          <button
            type="button"
            onClick={runEvalRequest}
            disabled={running}
            className="mt-4 inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm disabled:cursor-not-allowed disabled:bg-indigo-300"
          >
            {running ? 'Running…' : 'Start Eval'}
          </button>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </section>

        {results.length > 0 && (
          <section className="rounded-xl border border-neutral-200 bg-white/70 p-5 shadow-sm backdrop-blur">
            <h2 className="text-lg font-medium">Leaderboard</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase tracking-wide text-neutral-500">
                    <th className="pb-2 pr-4">Model</th>
                    <th className="pb-2 pr-4 text-right">Exact</th>
                    <th className="pb-2 pr-4 text-right">BLEU-lite</th>
                    <th className="pb-2 pr-4 text-right">Latency</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result) => (
                    <tr key={result.model} className="border-b last:border-none">
                      <td className="py-2 pr-4 font-medium text-neutral-800">{result.model}</td>
                      <td className="py-2 pr-4 text-right text-neutral-700">
                        {(result.metrics.exact_match * 100).toFixed(1)}%
                      </td>
                      <td className="py-2 pr-4 text-right text-neutral-700">
                        {(result.metrics.bleu_like * 100).toFixed(1)}%
                      </td>
                      <td className="py-2 pr-4 text-right text-neutral-700">
                        {Math.round(result.metrics.avg_latency_ms)} ms
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {results.map((result) => (
                <article key={`${result.model}-samples`} className="rounded-lg border border-neutral-100 bg-white/80 p-4 shadow-sm">
                  <header className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-neutral-800">{result.model}</h3>
                    <span className="text-xs text-neutral-500">
                      Avg latency {Math.round(result.metrics.avg_latency_ms)} ms
                    </span>
                  </header>
                  <ul className="flex flex-col gap-3 text-xs text-neutral-600">
                    {result.responses.map((response, index) => (
                      <li key={`${result.model}-${index}`} className="rounded-md border border-neutral-100 bg-white/70 p-3">
                        <p className="font-semibold text-neutral-700">Prompt</p>
                        <p>{response.prompt}</p>
                        <p className="mt-2 font-semibold text-neutral-700">Expected</p>
                        <p>{response.expected}</p>
                        <p className="mt-2 font-semibold text-neutral-700">Actual</p>
                        <p>{response.actual}</p>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
