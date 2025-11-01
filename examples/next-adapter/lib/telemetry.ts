import { featureFlags } from '@/examples/next-adapter/lib/featureFlags';
import { sbServer } from '@/examples/next-adapter/lib/supabase/server';

const COST_TABLE: Record<string, number> = {
  // EDIT HERE: adjust per-provider per-1K token pricing
  'openai:gpt-4o-mini:prompt': 0.0005,
  'openai:gpt-4o-mini:completion': 0.0015,
};

export type UsageInput = {
  provider: string;
  model: string;
  operation: string;
  tokensIn?: number;
  tokensOut?: number;
  latencyMs?: number;
  meta?: Record<string, any>;
};

export async function recordProviderUsage(usage: UsageInput) {
  if (!featureFlags.FF_COST_TELEMETRY) return;
  const sb = sbServer();
  const keyPrompt = `${usage.provider}:${usage.model}:prompt`;
  const keyCompletion = `${usage.provider}:${usage.model}:completion`;
  const cost =
    (usage.tokensIn ?? 0) / 1000 * (COST_TABLE[keyPrompt] ?? 0) +
    (usage.tokensOut ?? 0) / 1000 * (COST_TABLE[keyCompletion] ?? 0);
  await sb.from('provider_usage').insert({
    provider: usage.provider,
    model: usage.model,
    operation: usage.operation,
    tokens_in: usage.tokensIn ?? 0,
    tokens_out: usage.tokensOut ?? 0,
    cost_est: Number(cost.toFixed(4)),
    latency_ms: usage.latencyMs ?? null,
    meta: usage.meta ?? {},
  });
}

export async function recordAlert(event: { kind: string; details: Record<string, any> }) {
  if (!featureFlags.FF_COST_TELEMETRY) return;
  const sb = sbServer();
  await sb.from('events').insert({
    source: 'alerts',
    kind: event.kind,
    title: event.kind,
    meta: event.details,
  });
}
