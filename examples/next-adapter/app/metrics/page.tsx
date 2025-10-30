import { fetchProviderUsage, fetchServiceHealth, summariseCosts } from '@/examples/next-adapter/lib/metrics';
import { flagEnabled } from '@/examples/next-adapter/lib/featureFlags';

export const revalidate = 15;

async function getData() {
  const [usage, health] = await Promise.all([
    fetchProviderUsage(50).catch(() => []),
    fetchServiceHealth(20).catch(() => []),
  ]);
  return { usage, health, costs: summariseCosts(usage) };
}

export default async function MetricsPage() {
  if (!flagEnabled('costTelemetry')) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
        <section className="rounded-xl border border-stone-800 bg-stone-900/60 p-6 text-stone-200 shadow-xl">
          <h1 className="text-2xl font-semibold">Metrics</h1>
          <p className="text-sm text-stone-400">Enable FF_COST_TELEMETRY to activate dashboards.</p>
        </section>
      </main>
    );
  }
  const { usage, health, costs } = await getData();
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-2 text-stone-200 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Operational Metrics</h1>
          <p className="text-sm text-stone-400">Cost posture, latency, and provider health snapshots.</p>
        </div>
        <span className="rounded-full border border-stone-700 px-4 py-1 text-xs uppercase tracking-wide text-stone-300">
          Observatory
        </span>
      </header>
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <article className="flex flex-col gap-4 rounded-2xl border border-stone-800 bg-stone-950/60 p-6 shadow-xl">
          <div>
            <h2 className="text-xl font-semibold text-stone-100">Daily Cost Estimates</h2>
            <p className="text-xs text-stone-500">Aggregated by provider usage. Adjust static maps in lib/metrics.ts.</p>
          </div>
          <div className="flex flex-col gap-2 text-sm text-stone-200">
            {costs.length === 0 && <p className="text-stone-500">No usage records yet.</p>}
            {costs.map((row) => (
              <div key={row.day} className="flex items-center justify-between rounded-lg border border-stone-800 bg-stone-900/80 px-3 py-2">
                <span className="font-medium">{row.day}</span>
                <span className="text-stone-300">${row.cost.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </article>
        <article className="flex flex-col gap-4 rounded-2xl border border-stone-800 bg-stone-950/60 p-6 shadow-xl">
          <div>
            <h2 className="text-xl font-semibold text-stone-100">Recent Provider Usage</h2>
            <p className="text-xs text-stone-500">Latency + token profile for each routed call.</p>
          </div>
          <div className="flex max-h-[360px] flex-col gap-3 overflow-y-auto pr-1">
            {usage.map((row, idx) => (
              <div
                key={`${row.provider}-${row.model}-${idx}`}
                className="flex flex-col gap-2 rounded-xl border border-stone-800 bg-stone-900/80 p-4 text-sm text-stone-200"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-stone-300">
                  <span className="font-semibold uppercase tracking-wide text-xs text-stone-400">{row.provider}</span>
                  <span className="text-xs text-stone-500">{new Date(row.ts).toLocaleString()}</span>
                </div>
                <div className="flex flex-col gap-1 text-xs text-stone-400">
                  <span className="text-stone-200">Model: {row.model}</span>
                  <span>Operation: {row.op}</span>
                  <span>Latency: {row.latency_ms.toLocaleString()} ms</span>
                  <span>Tokens: in {row.tokens_in.toLocaleString()} / out {row.tokens_out.toLocaleString()}</span>
                  <span>Cost est: ${row.cost_est.toFixed(4)}</span>
                </div>
              </div>
            ))}
            {usage.length === 0 && <p className="text-sm text-stone-500">No provider usage captured yet.</p>}
          </div>
        </article>
      </section>
      <section className="rounded-2xl border border-stone-800 bg-stone-950/60 p-6 shadow-xl">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h2 className="text-xl font-semibold text-stone-100">Service Health</h2>
          <p className="text-xs text-stone-500">Realtime ping data. Alerts escalate when error budgets are exceeded.</p>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {health.map((row) => (
            <div key={`${row.name}-${row.ts}`} className="flex flex-col gap-2 rounded-xl border border-stone-800 bg-stone-900/80 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-stone-200">{row.name}</span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                    row.status === 'ok'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : row.status === 'degraded'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  {row.status}
                </span>
              </div>
              <div className="flex flex-col gap-1 text-stone-400">
                <span>P95 latency: {row.latency_p95.toLocaleString()} ms</span>
                <span>Error rate: {(row.error_rate * 100).toFixed(2)}%</span>
                <span className="text-xs text-stone-500">Updated {new Date(row.ts).toLocaleString()}</span>
              </div>
            </div>
          ))}
          {health.length === 0 && <p className="text-sm text-stone-500">No health pings recorded yet.</p>}
        </div>
      </section>
    </main>
  );
}
