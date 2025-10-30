import { createClient } from '@supabase/supabase-js';
import { flagEnabled } from '@/examples/next-adapter/lib/featureFlags';

export type ProviderUsage = {
  provider: string;
  model: string;
  op: string;
  tokens_in: number;
  tokens_out: number;
  cost_est: number;
  latency_ms: number;
  ts: string;
  meta?: Record<string, any>;
};

export type ServiceHealth = {
  name: string;
  status: string;
  latency_p95: number;
  error_rate: number;
  ts: string;
};

const mockUsage: ProviderUsage[] = [
  {
    provider: 'openai',
    model: 'gpt-4.1-mini',
    op: 'chat.completions',
    tokens_in: 1200,
    tokens_out: 900,
    cost_est: 0.75,
    latency_ms: 1200,
    ts: new Date().toISOString(),
    meta: { note: 'mock data' },
  },
  {
    provider: 'anthropic',
    model: 'claude-3-haiku',
    op: 'messages',
    tokens_in: 800,
    tokens_out: 500,
    cost_est: 0.3,
    latency_ms: 900,
    ts: new Date().toISOString(),
  },
];

const mockHealth: ServiceHealth[] = [
  { name: 'llm-router', status: 'ok', latency_p95: 900, error_rate: 0.01, ts: new Date().toISOString() },
  { name: 'search-index', status: 'degraded', latency_p95: 1500, error_rate: 0.05, ts: new Date().toISOString() },
];

function supabaseService() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function fetchProviderUsage(limit = 100): Promise<ProviderUsage[]> {
  if (!flagEnabled('costTelemetry')) return [];
  const sb = supabaseService();
  if (!sb || process.env.USE_MOCKS === 'true') return mockUsage;
  const { data, error } = await sb
    .from('provider_usage')
    .select('*')
    .order('ts', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as ProviderUsage[];
}

export async function fetchServiceHealth(limit = 50): Promise<ServiceHealth[]> {
  if (!flagEnabled('costTelemetry')) return [];
  const sb = supabaseService();
  if (!sb || process.env.USE_MOCKS === 'true') return mockHealth;
  const { data, error } = await sb
    .from('service_health')
    .select('*')
    .order('ts', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as ServiceHealth[];
}

export function summariseCosts(usage: ProviderUsage[]) {
  const totals: Record<string, number> = {};
  for (const row of usage) {
    const day = row.ts.slice(0, 10);
    totals[day] = (totals[day] ?? 0) + row.cost_est;
  }
  return Object.entries(totals)
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([day, cost]) => ({ day, cost }));
}
