import { NextRequest } from 'next/server';
import { fetchMetricsSummary } from '@/examples/next-adapter/lib/metrics/query';

export async function GET(_req: NextRequest) {
  try {
    const summary = await fetchMetricsSummary();
    return Response.json({
      dailyCosts: summary.dailyCosts,
      latencyP95: summary.latencyP95,
      services: summary.services.map(({ name, status, latency_p95, error_rate, ts }) => ({
        name,
        status,
        latency_p95,
        error_rate,
        ts,
      })),
    });
  } catch (err: any) {
    return new Response(err?.message || 'Failed to load metrics', { status: 500 });
  }
}
