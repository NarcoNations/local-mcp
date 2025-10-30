import { sbAdmin } from '@/examples/next-adapter/lib/supabase/admin';
import { estimateCost } from '@/examples/next-adapter/lib/metrics/costs';
import { featureFlags } from '@/examples/next-adapter/lib/env';

export async function recordProviderUsage(params: {
  provider: string;
  model: string;
  operation: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
  meta?: Record<string, any>;
}) {
  if (!featureFlags.costTelemetry) return;
  const supabase = sbAdmin();
  const cost = estimateCost(params.provider, params.model, params.tokensIn, params.tokensOut);
  await supabase.from('provider_usage').insert({
    provider: params.provider,
    model: params.model,
    op: params.operation,
    tokens_in: params.tokensIn,
    tokens_out: params.tokensOut,
    cost_est: cost,
    latency_ms: params.latencyMs,
    ts: new Date().toISOString(),
    meta: params.meta ?? {},
  });
}

export async function recordServiceHealth(params: {
  name: string;
  status: 'up' | 'down' | 'degraded';
  latencyP95: number;
  errorRate: number;
}) {
  if (!featureFlags.costTelemetry) return;
  const supabase = sbAdmin();
  await supabase.from('service_health').insert({
    name: params.name,
    status: params.status,
    latency_p95: params.latencyP95,
    error_rate: params.errorRate,
    ts: new Date().toISOString(),
  });
}
