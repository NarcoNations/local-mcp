import { NextResponse } from 'next/server';
import { loadMetrics } from '@/examples/next-adapter/lib/telemetry/metrics';

export async function GET() {
  const metrics = await loadMetrics();
  return NextResponse.json({
    generated_at: new Date().toISOString(),
    ...metrics,
  });
}
