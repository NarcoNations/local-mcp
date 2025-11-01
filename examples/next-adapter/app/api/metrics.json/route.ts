import { NextResponse } from 'next/server';
import { sbServer } from '@/examples/next-adapter/lib/supabase/server';

function toDateKey(value: string) {
  return value.split('T')[0];
}

export async function GET() {
  const sb = sbServer();
  const { data: usageRows, error: usageError } = await sb
    .from('provider_usage')
    .select('recorded_at, cost_est, latency_ms, provider, model')
    .gte('recorded_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('recorded_at', { ascending: false });
  if (usageError) {
    return NextResponse.json({ error: usageError.message }, { status: 500 });
  }

  const dailyCost = new Map<string, number>();
  const latency = new Map<string, number[]>();
  for (const row of usageRows ?? []) {
    const day = toDateKey(row.recorded_at as string);
    dailyCost.set(day, (dailyCost.get(day) ?? 0) + Number(row.cost_est ?? 0));
    if (!latency.has(day)) latency.set(day, []);
    if (row.latency_ms != null) latency.get(day)!.push(row.latency_ms as number);
  }
  const latencySummary = Array.from(latency.entries()).map(([day, samples]) => {
    const sorted = samples.sort((a, b) => a - b);
    const p95 = sorted[Math.floor(0.95 * (sorted.length - 1))] ?? 0;
    return { day, p95 };
  });

  const { data: healthRows } = await sb
    .from('service_health')
    .select('*')
    .order('checked_at', { ascending: false })
    .limit(10);

  return NextResponse.json({
    dailyCost: Array.from(dailyCost.entries()).map(([day, cost]) => ({ day, cost })),
    latencyP95: latencySummary,
    health: healthRows ?? [],
  });
}
