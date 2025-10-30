import { NextRequest } from 'next/server';
import { fetchMetricsSummary } from '@/examples/next-adapter/lib/metrics/query';
import { requireScope } from '@/examples/next-adapter/lib/security/apiAuth';

export async function GET(_req: NextRequest) {
  try {
    await requireScope(_req, 'admin:*');
    const summary = await fetchMetricsSummary();
    return Response.json({ ok: true, summary });
  } catch (err: any) {
    return new Response(err?.message || 'Failed to load metrics', { status: 500 });
  }
}
