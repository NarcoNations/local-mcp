import { sbAdmin } from '@/examples/next-adapter/lib/supabase/admin';

export type MetricsSummary = {
  dailyCosts: { date: string; cost: number }[];
  weeklyCosts: { week: string; cost: number }[];
  latencyP95: { provider: string; latency: number }[];
  errorRates: { provider: string; errorRate: number }[];
  services: { name: string; status: string; latency_p95: number; error_rate: number; ts: string }[];
};

export async function fetchMetricsSummary(): Promise<MetricsSummary> {
  const supabase = sbAdmin();
  const today = new Date();
  const start = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

  const { data: usage } = await supabase
    .from('provider_usage')
    .select('ts,cost_est,provider,latency_ms')
    .gte('ts', start.toISOString());
  const { data: health } = await supabase
    .from('service_health')
    .select('*')
    .gte('ts', start.toISOString())
    .order('ts', { ascending: false });

  const daily = new Map<string, number>();
  const weekly = new Map<string, number>();
  const latencyMap = new Map<string, number[]>();

  (usage ?? []).forEach((row: any) => {
    const ts = new Date(row.ts);
    const dayKey = ts.toISOString().slice(0, 10);
    const weekKey = `${ts.getUTCFullYear()}-W${Math.ceil(((ts.getUTCDate() + ts.getUTCDay()) / 7) || 1)}`;
    daily.set(dayKey, (daily.get(dayKey) || 0) + (row.cost_est || 0));
    weekly.set(weekKey, (weekly.get(weekKey) || 0) + (row.cost_est || 0));
    const key = row.provider || 'unknown';
    if (!latencyMap.has(key)) latencyMap.set(key, []);
    latencyMap.get(key)!.push(row.latency_ms || 0);
  });

  const latencyP95 = Array.from(latencyMap.entries()).map(([provider, values]) => {
    const sorted = values.sort((a, b) => a - b);
    const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));
    return { provider, latency: sorted[idx] || 0 };
  });

  const errorRates = Array.from((health ?? []).reduce((acc, row: any) => {
    const { name, error_rate } = row;
    acc.set(name, Math.max(acc.get(name) || 0, error_rate || 0));
    return acc;
  }, new Map<string, number>()).entries()).map(([provider, errorRate]) => ({ provider, errorRate }));

  return {
    dailyCosts: Array.from(daily.entries()).map(([date, cost]) => ({ date, cost })),
    weeklyCosts: Array.from(weekly.entries()).map(([week, cost]) => ({ week, cost })),
    latencyP95,
    errorRates,
    services: (health ?? []) as any,
  };
}
