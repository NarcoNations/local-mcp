import type { FeedRequest, FeedResponse } from '../../types';

// Minimal free-tier friendly driver (Alpha Vantage).
export async function fetchFeed(req: FeedRequest): Promise<FeedResponse> {
  const key = process.env.ALPHA_VANTAGE_KEY;
  if (!key) return { error: 'ALPHA_VANTAGE_KEY not set (skeleton)' };
  const url = new URL('https://www.alphavantage.co/query');
  url.searchParams.set('function', req.fn);
  url.searchParams.set('symbol', req.symbol);
  url.searchParams.set('apikey', key);
  const res = await fetch(url);
  if (!res.ok) return { error: 'feed request failed', status: res.status };
  return res.json();
}
