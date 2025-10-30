export const runtime = 'nodejs';
import { NextRequest } from 'next/server';
import { fetchFeed, type FeedRequest } from '@/packages/api-manager/src';
import { logEvent } from '@/examples/next-adapter/lib/historian';

const cache = new Map<string, { data: unknown; expires: number }>();
const TTL_MS = 60_000;

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const fn = url.searchParams.get('fn') as FeedRequest['fn'] | null;
  const symbol = url.searchParams.get('symbol');
  if (!fn || !symbol) {
    return new Response('fn and symbol required', { status: 400 });
  }
  const key = `${fn}:${symbol}`.toLowerCase();
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expires > now) {
    await logEvent({
      source: 'api',
      kind: 'api.feed',
      title: `AlphaVantage cached ${fn} ${symbol}`,
      meta: { fn, symbol, cached: true }
    });
    return Response.json({ ok: true, cached: true, data: cached.data });
  }

  const started = Date.now();
  try {
    const data = await fetchFeed({ fn, symbol });
    const duration = Date.now() - started;
    if ((data as any)?.error) {
      await logEvent({
        source: 'api',
        kind: 'error',
        title: 'AlphaVantage feed error',
        meta: { fn, symbol, duration, error: (data as any).error, status: (data as any).status }
      });
      return Response.json({ ok: false, error: (data as any).error, status: (data as any).status ?? 500 }, {
        status: (data as any).status ?? 500
      });
    }
    cache.set(key, { data, expires: now + TTL_MS });
    await logEvent({
      source: 'api',
      kind: 'api.feed',
      title: `AlphaVantage ${fn} ${symbol}`,
      meta: { fn, symbol, duration, cached: false }
    });
    return Response.json({ ok: true, cached: false, data });
  } catch (err: any) {
    const message = err?.message || 'feed fetch failed';
    await logEvent({
      source: 'api',
      kind: 'error',
      title: 'AlphaVantage fetch exception',
      meta: { fn, symbol, error: message }
    });
    return new Response(message, { status: 500 });
  }
}
