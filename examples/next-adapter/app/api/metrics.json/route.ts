import { NextRequest } from 'next/server';
import { fetchProviderUsage, fetchServiceHealth, summariseCosts } from '@/examples/next-adapter/lib/metrics';
import { flagEnabled } from '@/examples/next-adapter/lib/featureFlags';

export const runtime = 'edge';

export async function GET(_req: NextRequest) {
  if (!flagEnabled('costTelemetry')) {
    return Response.json({ ok: false, message: 'telemetry disabled' }, { status: 503 });
  }
  const [usage, health] = await Promise.all([
    fetchProviderUsage(100).catch(() => []),
    fetchServiceHealth(50).catch(() => []),
  ]);
  const costSummary = summariseCosts(usage).map((row) => ({ day: row.day, cost: row.cost }));
  const sanitizedUsage = usage.map((row) => ({
    provider: row.provider,
    model: row.model,
    op: row.op,
    cost_est: row.cost_est,
    latency_ms: row.latency_ms,
    ts: row.ts,
  }));
  return Response.json({ ok: true, usage: sanitizedUsage, health, costSummary });
}
