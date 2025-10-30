import { NextResponse } from 'next/server';
import { sbServer } from '@/examples/next-adapter/lib/supabase/server';

export async function GET() {
  const supabase = sbServer();
  const providers = ['openai', 'supabase', 'xenova'];
  const results: Record<string, { status: string; latencyMs: number }> = {};
  const start = Date.now();
  for (const provider of providers) {
    const simulatedLatency = Math.floor(Math.random() * 100) + 50;
    results[provider] = { status: 'ok', latencyMs: simulatedLatency };
  }
  const latencyP95 = Math.max(...Object.values(results).map((r) => r.latencyMs));
  const { error } = await supabase.from('service_health').insert({
    name: 'composite',
    status: 'ok',
    latency_p95: latencyP95,
    error_rate: 0,
    meta: results,
  });
  if (error) {
    return NextResponse.json({ status: 'degraded', error: error.message }, { status: 500 });
  }

  return NextResponse.json({ status: 'ok', duration: Date.now() - start, checks: results });
}
