export const runtime = 'nodejs';
import { NextRequest } from 'next/server';
import { fetchFeed, type FeedRequest } from '../../../../../../packages/api-manager/src';
import { logEvent } from '@/examples/next-adapter/lib/historian';

const cache = new Map<string, { expires: number; payload: any }>();
const TTL = 60_000;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const fn = url.searchParams.get('fn') as FeedRequest['fn'] | null;
  const symbol = url.searchParams.get('symbol');
  if (!fn || !symbol || !isValidFunction(fn)) {
    return new Response('fn and symbol query params are required', { status: 400 });
  }

  const key = `${fn}:${symbol}`;
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expires > now) {
    await logEvent({
      source: 'api-manager',
      kind: 'api.feed',
      title: 'Alpha feed (cached)',
      meta: { fn, symbol, cached: true }
    });
    return Response.json({ ok: true, cached: true, data: cached.payload });
  }

  const start = Date.now();
  try {
    const data = await fetchFeed({ fn, symbol });
    if ((data as any)?.error) {
      throw new Error((data as any).error);
    }
    cache.set(key, { expires: now + TTL, payload: data });
    const duration = Date.now() - start;
    await logEvent({
      source: 'api-manager',
      kind: 'api.feed',
      title: 'Alpha feed fetched',
      meta: { fn, symbol, duration_ms: duration, cached: false }
    });
    return Response.json({ ok: true, cached: false, data });
  } catch (e: any) {
    await logEvent({
      source: 'api-manager',
      kind: 'error',
      title: 'Alpha feed failed',
      body: e?.message || 'unknown',
      meta: { fn, symbol }
    });
    return new Response('Error: ' + (e?.message || 'unknown'), { status: 500 });
  }
}

function isValidFunction(fn: string): fn is FeedRequest['fn'] {
  return fn === 'TIME_SERIES_DAILY' || fn === 'OVERVIEW';
}
