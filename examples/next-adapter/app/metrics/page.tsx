'use client';

import { useEffect, useState } from 'react';

type CostPoint = { date: string; total: number };

type MetricsResponse = {
  costEnabled: boolean;
  usage: any[];
  health: any[];
  dailyCost: CostPoint[];
  weeklyCost: { week: string; total: number }[];
};

export default function MetricsPage() {
  const [data, setData] = useState<MetricsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/metrics')
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => setError(err?.message ?? 'Failed to load metrics'));
  }, []);

  const dailyMax = data?.dailyCost.reduce((max, p) => Math.max(max, p.total), 0) ?? 1;
  const weeklyMax = data?.weeklyCost.reduce((max, p) => Math.max(max, p.total), 0) ?? 1;

  return (
    <main className="px-4 py-6 lg:py-10">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Telemetry &amp; Metrics</h1>
            <p className="text-sm text-neutral-500">
              Live cost, latency, and health snapshots for providers and pipelines.
            </p>
          </div>
          {data?.costEnabled === false && (
            <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
              Cost telemetry disabled (enable FF_COST_TELEMETRY)
            </span>
          )}
        </header>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}

        {!data && !error && <div className="text-sm text-neutral-500">Loading metrics…</div>}

        {data && (
          <div className="grid gap-6 lg:grid-cols-2">
            <article className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white/70 p-5 shadow-sm backdrop-blur">
              <h2 className="text-lg font-medium">Daily Cost</h2>
              <div className="flex w-full flex-col gap-3">
                {data.dailyCost.length === 0 && <p className="text-sm text-neutral-500">No usage recorded.</p>}
                {data.dailyCost.map((point) => (
                  <div key={point.date} className="flex items-center gap-3 text-sm">
                    <span className="w-20 shrink-0 font-mono text-xs text-neutral-500">{point.date}</span>
                    <div className="h-2 flex-1 rounded-full bg-neutral-100">
                      <div
                        className="h-2 rounded-full bg-sky-500"
                        style={{ width: `${Math.max((point.total / dailyMax) * 100, 4)}%` }}
                      />
                    </div>
                    <span className="w-16 text-right font-medium">${point.total.toFixed(4)}</span>
                  </div>
                ))}
              </div>
            </article>
            <article className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white/70 p-5 shadow-sm backdrop-blur">
              <h2 className="text-lg font-medium">Weekly Cost</h2>
              <div className="flex w-full flex-col gap-3">
                {data.weeklyCost.length === 0 && <p className="text-sm text-neutral-500">No usage recorded.</p>}
                {data.weeklyCost.map((point) => (
                  <div key={point.week} className="flex items-center gap-3 text-sm">
                    <span className="w-20 shrink-0 font-mono text-xs text-neutral-500">{point.week}</span>
                    <div className="h-2 flex-1 rounded-full bg-neutral-100">
                      <div
                        className="h-2 rounded-full bg-indigo-500"
                        style={{ width: `${Math.max((point.total / weeklyMax) * 100, 4)}%` }}
                      />
                    </div>
                    <span className="w-16 text-right font-medium">${point.total.toFixed(4)}</span>
                  </div>
                ))}
              </div>
            </article>
          </div>
        )}

        {data && (
          <section className="rounded-xl border border-neutral-200 bg-white/70 p-5 shadow-sm backdrop-blur">
            <h2 className="text-lg font-medium">Provider Usage</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase tracking-wide text-neutral-500">
                    <th className="pb-2 pr-4">Provider</th>
                    <th className="pb-2 pr-4">Model</th>
                    <th className="pb-2 pr-4">Operation</th>
                    <th className="pb-2 pr-4 text-right">Tokens</th>
                    <th className="pb-2 pr-4 text-right">Cost ($)</th>
                    <th className="pb-2 pr-4 text-right">Latency (ms)</th>
                    <th className="pb-2 pr-4">Captured</th>
                  </tr>
                </thead>
                <tbody>
                  {data.usage.map((row, index) => (
                    <tr key={`${row.provider}-${row.model}-${index}`} className="border-b last:border-none">
                      <td className="py-2 pr-4 font-medium text-neutral-800">{row.provider}</td>
                      <td className="py-2 pr-4 text-neutral-700">{row.model}</td>
                      <td className="py-2 pr-4 text-neutral-700">{row.op}</td>
                      <td className="py-2 pr-4 text-right text-neutral-700">
                        {row.tokens_in + row.tokens_out}
                      </td>
                      <td className="py-2 pr-4 text-right font-medium">{row.cost_est.toFixed(4)}</td>
                      <td className="py-2 pr-4 text-right text-neutral-700">{row.latency_ms}</td>
                      <td className="py-2 pr-4 text-xs text-neutral-500">{new Date(row.ts).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {data && (
          <section className="rounded-xl border border-neutral-200 bg-white/70 p-5 shadow-sm backdrop-blur">
            <h2 className="text-lg font-medium">Service Health</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.health.map((service) => (
                <div
                  key={service.name}
                  className="flex flex-col gap-1 rounded-lg border border-neutral-100 bg-white/80 p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-neutral-800">{service.name}</span>
                    <span
                      className={`text-xs font-semibold uppercase ${
                        service.status === 'up'
                          ? 'text-emerald-600'
                          : service.status === 'degraded'
                          ? 'text-amber-600'
                          : 'text-red-600'
                      }`}
                    >
                      {service.status}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500">
                    p95 latency <strong className="font-semibold text-neutral-700">{service.latency_p95}ms</strong>
                  </p>
                  <p className="text-xs text-neutral-500">
                    Error rate <strong className="font-semibold text-neutral-700">{service.error_rate * 100}%</strong>
                  </p>
                  <p className="text-[11px] text-neutral-400">Updated {new Date(service.ts).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
