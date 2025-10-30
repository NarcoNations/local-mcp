import { sbServer } from '@/examples/next-adapter/lib/supabase/server';

async function getMetrics() {
  const sb = sbServer();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: usageRows } = await sb
    .from('provider_usage')
    .select('recorded_at, cost_est, latency_ms')
    .gte('recorded_at', since)
    .order('recorded_at', { ascending: false });
  const { data: healthRows } = await sb
    .from('service_health')
    .select('*')
    .order('checked_at', { ascending: false })
    .limit(10);

  const dailyCost = new Map<string, number>();
  const latency = new Map<string, number[]>();
  for (const row of usageRows ?? []) {
    const day = (row.recorded_at as string).split('T')[0];
    dailyCost.set(day, (dailyCost.get(day) ?? 0) + Number(row.cost_est ?? 0));
    if (!latency.has(day)) latency.set(day, []);
    if (row.latency_ms != null) latency.get(day)!.push(row.latency_ms as number);
  }

  const latencyP95 = Array.from(latency.entries()).map(([day, samples]) => {
    const sorted = samples.sort((a, b) => a - b);
    const p95 = sorted[Math.floor(0.95 * (sorted.length - 1))] ?? 0;
    return { day, p95 };
  });

  return {
    dailyCost: Array.from(dailyCost.entries()).map(([day, cost]) => ({ day, cost })),
    latencyP95,
    health: healthRows ?? [],
  };
}

export default async function MetricsPage() {
  const metrics = await getMetrics();
  return (
    <main style={{ display: 'grid', gap: 24 }}>
      <section style={{ display: 'grid', gap: 12 }}>
        <header>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600 }}>Cost &amp; Latency Metrics</h1>
          <p style={{ color: '#555' }}>
            Rolling summaries of provider usage. Daily costs use model lookup tables (edit server-side maps).
          </p>
        </header>
        <div
          style={{
            display: 'grid',
            gap: 16,
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          }}
        >
          {metrics.dailyCost.map((row: any) => (
            <article
              key={row.day}
              style={{
                border: '1px solid #e2e2e2',
                borderRadius: 12,
                padding: 16,
                background: 'linear-gradient(135deg, #101820 0%, #1f2b38 100%)',
                color: '#e5f4ff',
              }}
            >
              <h2 style={{ fontSize: '1rem', fontWeight: 500 }}>{row.day}</h2>
              <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>${row.cost.toFixed(2)}</p>
              <small style={{ opacity: 0.7 }}>Estimated spend across providers.</small>
            </article>
          ))}
        </div>
      </section>

      <section style={{ display: 'grid', gap: 12 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Latency p95</h2>
        <div
          style={{
            display: 'grid',
            gap: 16,
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          }}
        >
          {metrics.latencyP95.map((row: any) => (
            <article
              key={row.day}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: 10,
                padding: 14,
                background: '#f7fafc',
              }}
            >
              <strong>{row.day}</strong>
              <p style={{ fontSize: '1.25rem', fontWeight: 600 }}>{row.p95} ms</p>
              <small style={{ color: '#4a5568' }}>p95 aggregated across runs</small>
            </article>
          ))}
        </div>
      </section>

      <section style={{ display: 'grid', gap: 12 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Service Health</h2>
        <div style={{ display: 'grid', gap: 12 }}>
          {metrics.health.map((row: any) => (
            <article
              key={row.id}
              style={{
                border: '1px solid #cbd5f5',
                borderRadius: 10,
                padding: 16,
                background: '#f8fbff',
                display: 'grid',
                gap: 4,
              }}
            >
              <strong>{row.name}</strong>
              <span>Status: {row.status}</span>
              <span>Latency p95: {row.latency_p95 ?? '—'} ms</span>
              <span>Error rate: {row.error_rate ?? 0}%</span>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
