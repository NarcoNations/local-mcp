import { NextRequest } from 'next/server';
import { z } from 'zod';
import { fetchFeed, type FeedProvider } from '@vibelabz/api-manager';
import { corsHeaders, applyCors } from '@/lib/http/cors';
import { checkRateLimit } from '@/lib/http/rate-limit';
import { logEvent } from '@/lib/historian';

export const runtime = 'nodejs';

const querySchema = z.object({
  symbol: z.string().min(1),
  kind: z.enum(['quote', 'timeseries', 'company']).default('quote'),
  interval: z.string().optional(),
  range: z.string().optional()
});

export async function GET(request: NextRequest, { params }: { params: { provider: string } }) {
  const cors = corsHeaders(request);
  const rate = checkRateLimit(request);
  if (!rate.allowed) {
    return applyCors(
      new Response(JSON.stringify({ error: 'rate limit exceeded' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      }),
      cors
    );
  }

  try {
    const provider = params.provider as FeedProvider;
    const query = querySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    const startedAt = Date.now();
    const result = await fetchFeed({
      provider,
      kind: query.kind,
      symbol: query.symbol,
      interval: (query.interval as any) ?? undefined,
      range: query.range
    });
    await logEvent({
      source: 'api-manager',
      kind: 'api.feed',
      title: `${provider}:${query.kind}:${query.symbol}`,
      meta: {
        provider,
        kind: query.kind,
        symbol: query.symbol,
        latency_ms: result.meta.latencyMs,
        cached: result.meta.cached,
        status: result.meta.status,
        started_at: startedAt
      }
    });
    return applyCors(Response.json(result), cors);
  } catch (err: any) {
    await logEvent({
      source: 'api-manager',
      kind: 'error',
      title: 'Feed fetch failed',
      meta: { message: err?.message, provider: params.provider }
    });
    return applyCors(
      new Response(JSON.stringify({ error: err?.message || 'Invalid request' }), {
        status: err?.status || 400,
        headers: { 'Content-Type': 'application/json' }
      }),
      cors
    );
  }
}

export function OPTIONS(request: NextRequest) {
  return applyCors(new Response(null, { status: 204 }), corsHeaders(request));
}
