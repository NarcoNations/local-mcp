export const runtime = 'nodejs';
import { NextRequest } from 'next/server';
import { fetchFeed } from '@vibelabz/api-manager';
import { logEvent } from '@/examples/next-adapter/lib/historian';

const cache = new Map<string, { data: any; expires: number; cachedAt: number }>();
const ttlMs = 60_000;

type Fn = 'TIME_SERIES_DAILY' | 'OVERVIEW';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const fn = url.searchParams.get('fn') as Fn | null;
    const symbol = url.searchParams.get('symbol');
    if (!fn || !['TIME_SERIES_DAILY', 'OVERVIEW'].includes(fn)) {
      return new Response('fn must be TIME_SERIES_DAILY or OVERVIEW', { status: 400 });
    }
    if (!symbol) return new Response('symbol required', { status: 400 });

    const cacheKey = `${fn}:${symbol.toUpperCase()}`;
    const now = Date.now();
    const cached = cache.get(cacheKey);
    if (cached && cached.expires > now) {
      await logEvent({
        source: 'api-manager',
        kind: 'api.feed',
        title: `Alpha feed (cached) ${symbol}`,
        meta: { fn, symbol, cached: true, durationMs: 0 }
      });
      return Response.json({ ok: true, cached: true, data: cached.data, cachedAt: cached.cachedAt });
    }

    const started = Date.now();
    const data = await fetchFeed({ fn, symbol });
    const durationMs = Date.now() - started;
    cache.set(cacheKey, { data, expires: now + ttlMs, cachedAt: now });

    const isError = Boolean(data && typeof data === 'object' && 'error' in data);
    await logEvent({
      source: 'api-manager',
      kind: 'api.feed',
      title: `Alpha feed ${symbol}`,
      meta: { fn, symbol, durationMs, cached: false, ok: !isError }
    });
    if (isError) {
      await logEvent({
        source: 'api-manager',
        kind: 'error',
        title: 'Alpha feed error',
        body: String((data as any).error || 'unknown'),
        meta: { fn, symbol }
      });
    }

    return Response.json({ ok: !isError, data, durationMs });
  } catch (err: any) {
    await logEvent({
      source: 'api-manager',
      kind: 'error',
      title: 'Alpha feed exception',
      body: err?.message || String(err)
    });
    return new Response('Error: ' + (err?.message || 'unknown'), { status: 500 });
  }
}
