import { sbServer } from '@/examples/next-adapter/lib/supabase/server';
import { featureFlags } from '@/examples/next-adapter/lib/flags';

type ProviderUsage = {
  provider: string;
  model: string;
  op: string;
  tokens_in: number;
  tokens_out: number;
  cost_est: number;
  latency_ms: number;
  ts: string;
  meta?: any;
};

type ServiceHealth = {
  name: string;
  status: 'up' | 'degraded' | 'down';
  latency_p95: number;
  error_rate: number;
  ts: string;
};

export type MetricsPayload = {
  costEnabled: boolean;
  usage: ProviderUsage[];
  health: ServiceHealth[];
  dailyCost: { date: string; total: number }[];
  weeklyCost: { week: string; total: number }[];
};

const MOCK_USAGE: ProviderUsage[] = [
  {
    provider: 'openai',
    model: 'gpt-4o-mini',
    op: 'chat',
    tokens_in: 1200,
    tokens_out: 900,
    cost_est: 0.0024,
    latency_ms: 750,
    ts: new Date().toISOString(),
  },
];

const MOCK_HEALTH: ServiceHealth[] = [
  {
    name: 'openai',
    status: 'up',
    latency_p95: 800,
    error_rate: 0.01,
    ts: new Date().toISOString(),
  },
];

function aggregateDaily(usage: ProviderUsage[]) {
  const map = new Map<string, number>();
  usage.forEach((row) => {
    const date = row.ts.slice(0, 10);
    map.set(date, (map.get(date) ?? 0) + row.cost_est);
  });
  return Array.from(map.entries())
    .sort((a, b) => (a[0] > b[0] ? 1 : -1))
    .map(([date, total]) => ({ date, total }));
}

function aggregateWeekly(usage: ProviderUsage[]) {
  const map = new Map<string, number>();
  usage.forEach((row) => {
    const date = new Date(row.ts);
    const firstDay = new Date(date);
    firstDay.setDate(date.getDate() - date.getDay());
    const key = firstDay.toISOString().slice(0, 10);
    map.set(key, (map.get(key) ?? 0) + row.cost_est);
  });
  return Array.from(map.entries())
    .sort((a, b) => (a[0] > b[0] ? 1 : -1))
    .map(([week, total]) => ({ week, total }));
}

export async function loadMetrics(): Promise<MetricsPayload> {
  if (!featureFlags.costTelemetry()) {
    return {
      costEnabled: false,
      usage: MOCK_USAGE,
      health: MOCK_HEALTH,
      dailyCost: aggregateDaily(MOCK_USAGE),
      weeklyCost: aggregateWeekly(MOCK_USAGE),
    };
  }

  try {
    const sb = sbServer();
    const [{ data: usageData }, { data: healthData }] = await Promise.all([
      sb.from('provider_usage').select().order('ts', { ascending: false }).limit(500),
      sb.from('service_health').select().order('ts', { ascending: false }).limit(50),
    ]);
    const usage = Array.isArray(usageData) ? (usageData as ProviderUsage[]) : MOCK_USAGE;
    const health = Array.isArray(healthData) ? (healthData as ServiceHealth[]) : MOCK_HEALTH;
    return {
      costEnabled: true,
      usage,
      health,
      dailyCost: aggregateDaily(usage),
      weeklyCost: aggregateWeekly(usage),
    };
  } catch (_) {
    return {
      costEnabled: featureFlags.costTelemetry(),
      usage: MOCK_USAGE,
      health: MOCK_HEALTH,
      dailyCost: aggregateDaily(MOCK_USAGE),
      weeklyCost: aggregateWeekly(MOCK_USAGE),
    };
  }
}
