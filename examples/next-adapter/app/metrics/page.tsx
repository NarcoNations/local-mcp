import { fetchMetricsSummary } from '@/examples/next-adapter/lib/metrics/query';
import { featureFlags } from '@/examples/next-adapter/lib/env';

export const revalidate = 0;

function StatCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        padding: '16px',
        borderRadius: 12,
        border: '1px solid var(--foreground-200, #e5e7eb)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        minWidth: 0,
        background: 'var(--background-elevated, rgba(255,255,255,0.9))',
      }}
    >
      <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{title}</h2>
      {children}
    </section>
  );
}

export default async function MetricsPage() {
  const summary = await fetchMetricsSummary();
  const costFlag = featureFlags.costTelemetry;
  return (
    <main style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700 }}>Metrics & Cost Telemetry</h1>
        <p style={{ color: 'var(--foreground-500,#6b7280)' }}>
          Track provider usage, estimated spend, and health across the studio stack.
        </p>
        {!costFlag && (
          <p style={{ fontSize: '0.9rem', color: 'var(--warning-600,#b45309)' }}>
            Feature flag <code>FF_COST_TELEMETRY</code> is disabled — showing cached data only.
          </p>
        )}
      </header>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))',
          gap: 16,
        }}
      >
        <StatCard title="Daily Cost (USD est.)">
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: 0, paddingLeft: 18 }}>
            {summary.dailyCosts.map((row) => (
              <li key={row.date} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span>{row.date}</span>
                <strong>${row.cost.toFixed(4)}</strong>
              </li>
            ))}
            {!summary.dailyCosts.length && <li>No telemetry yet.</li>}
          </ul>
        </StatCard>
        <StatCard title="Weekly Cost (USD est.)">
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: 0, paddingLeft: 18 }}>
            {summary.weeklyCosts.map((row) => (
              <li key={row.week} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span>{row.week}</span>
                <strong>${row.cost.toFixed(4)}</strong>
              </li>
            ))}
            {!summary.weeklyCosts.length && <li>No telemetry yet.</li>}
          </ul>
        </StatCard>
        <StatCard title="Latency P95 (ms)">
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: 0, paddingLeft: 18 }}>
            {summary.latencyP95.map((row) => (
              <li key={row.provider} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span>{row.provider}</span>
                <strong>{row.latency.toFixed(0)} ms</strong>
              </li>
            ))}
            {!summary.latencyP95.length && <li>Latency data not available.</li>}
          </ul>
        </StatCard>
        <StatCard title="Error Budget">
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: 0, paddingLeft: 18 }}>
            {summary.errorRates.map((row) => (
              <li key={row.provider} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span>{row.provider}</span>
                <strong>{(row.errorRate * 100).toFixed(2)}%</strong>
              </li>
            ))}
            {!summary.errorRates.length && <li>No incidents recorded.</li>}
          </ul>
        </StatCard>
      </div>
      <StatCard title="Service Health">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {summary.services.map((service) => (
            <div
              key={`${service.name}-${service.ts}`}
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 12,
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--foreground-100,#f3f4f6)',
                paddingBottom: 8,
              }}
            >
              <div style={{ minWidth: 140 }}>
                <strong>{service.name}</strong>
                <div style={{ fontSize: '0.85rem', color: 'var(--foreground-500,#6b7280)' }}>{service.status}</div>
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <span>Latency: {service.latency_p95 ?? 0} ms</span>
                <span>Error rate: {(service.error_rate ?? 0) * 100}%</span>
                <span>Updated: {new Date(service.ts).toLocaleString()}</span>
              </div>
            </div>
          ))}
          {!summary.services.length && <p>No health checks stored yet.</p>}
        </div>
      </StatCard>
    </main>
  );
}
