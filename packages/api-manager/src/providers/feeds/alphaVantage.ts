import type { FeedRequest, FeedResponse } from '../../types';

const BASE_URL = 'https://www.alphavantage.co/query';

// Minimal free-tier friendly driver (Alpha Vantage) with optional mock payloads when the key is missing.
export async function fetchFeed(req: FeedRequest): Promise<FeedResponse> {
  const key = process.env.ALPHA_VANTAGE_KEY;
  if (!key) {
    return {
      mock: true,
      note: 'Set ALPHA_VANTAGE_KEY to fetch live Alpha Vantage data.',
      request: req,
      data: samplePayload(req)
    };
  }
  const url = new URL(BASE_URL);
  url.searchParams.set('function', req.fn);
  url.searchParams.set('symbol', req.symbol);
  url.searchParams.set('apikey', key);
  const res = await fetch(url);
  if (!res.ok) {
    return { error: 'feed request failed', status: res.status, request: req };
  }
  try {
    return await res.json();
  } catch (err: any) {
    return { error: 'invalid json', request: req, detail: err?.message };
  }
}

function samplePayload(req: FeedRequest) {
  if (req.fn === 'OVERVIEW') {
    return {
      Symbol: req.symbol.toUpperCase(),
      AssetType: 'Common Stock',
      Name: 'Mock Overview',
      Description: 'Alpha Vantage key missing — this is placeholder metadata for development.',
      Exchange: 'SIM',
      Currency: 'USD',
      Country: 'US',
      FiscalYearEnd: 'December'
    };
  }
  return {
    'Meta Data': {
      '1. Information': 'TIME_SERIES_DAILY (mock)',
      '2. Symbol': req.symbol.toUpperCase(),
      '3. Last Refreshed': new Date().toISOString(),
      '4. Output Size': 'Compact',
      '5. Time Zone': 'US/Eastern'
    },
    'Time Series (Daily)': {
      [new Date().toISOString().slice(0, 10)]: {
        '1. open': '0.00',
        '2. high': '0.00',
        '3. low': '0.00',
        '4. close': '0.00',
        '5. volume': '0'
      }
    }
  };
}
