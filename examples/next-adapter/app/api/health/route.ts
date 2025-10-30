import { NextRequest } from 'next/server';
import { requireScope } from '@/examples/next-adapter/lib/security/apiAuth';
import { recordServiceHealth } from '@/examples/next-adapter/lib/metrics/record';

async function probe(url?: string) {
  if (!url) return { status: 'unknown', latency: 0, ok: false };
  const start = Date.now();
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return { status: res.ok ? 'up' : 'degraded', latency: Date.now() - start, ok: res.ok };
  } catch (_) {
    return { status: 'down', latency: Date.now() - start, ok: false };
  }
}

export async function GET(req: NextRequest) {
  await requireScope(req, 'admin:*');
  const services = [
    { name: 'openai', url: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1/models' },
    { name: 'anthropic', url: process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com/v1/models' },
  ];

  const results = await Promise.all(services.map(async (service) => {
    const res = await probe(service.url);
    await recordServiceHealth({
      name: service.name,
      status: res.status as any,
      latencyP95: res.latency,
      errorRate: res.ok ? 0 : 1,
    });
    return { name: service.name, status: res.status, latency_ms: res.latency };
  }));

  return Response.json({ ok: true, results });
}
