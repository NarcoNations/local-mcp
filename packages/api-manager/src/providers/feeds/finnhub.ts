import { QuoteDTO, TimeseriesDTO, CompanyDTO, type FeedRequest, type FeedResponse } from '../../types';

const API_BASE = 'https://finnhub.io/api/v1';

function getKey() {
  return process.env.FINNHUB_KEY || process.env.FINNHUB_API_KEY;
}

async function fetchJson(path: string, params: Record<string, string>) {
  const apiKey = getKey();
  if (!apiKey) return { error: 'FINNHUB_KEY is not configured' };
  const url = new URL(`${API_BASE}${path}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  url.searchParams.set('token', apiKey);
  const res = await fetch(url.toString());
  if (res.status === 429) {
    return { error: 'Finnhub rate limit exceeded', retryable: true, status: res.status };
  }
  if (!res.ok) return { error: `Finnhub error ${res.status}` };
  return res.json();
}

export async function fetchFinnhub(request: FeedRequest): Promise<FeedResponse> {
  const apiKey = getKey();
  if (!apiKey) {
    return {
      provider: 'finnhub',
      status: 'error',
      cached: false,
      error: 'FINNHUB_KEY is not configured',
    };
  }

  const resource = request.resource;
  try {
    if (resource === 'quote') {
      const json: any = await fetchJson('/quote', { symbol: request.symbol });
      if (json.error) {
        return {
          provider: 'finnhub',
          status: 'error',
          cached: false,
          error: json.error,
          meta: { retryable: json.retryable, status: json.status },
        };
      }
      const quote = QuoteDTO.parse({
        symbol: request.symbol,
        price: json.c ?? null,
        open: json.o ?? null,
        high: json.h ?? null,
        low: json.l ?? null,
        previousClose: json.pc ?? null,
        change: json.d ?? null,
        changePercent: json.dp ?? null,
        currency: json.currency ?? 'USD',
        timestamp: json.t ? new Date(json.t * 1000).toISOString() : new Date().toISOString(),
      });
      return { provider: 'finnhub', status: 'ok', cached: false, quote, raw: json };
    }

    if (resource === 'timeseries') {
      const to = Math.floor(Date.now() / 1000);
      const days = request.range === 'compact' ? 30 : 365;
      const from = to - days * 24 * 60 * 60;
      const json: any = await fetchJson('/stock/candle', {
        symbol: request.symbol,
        resolution: 'D',
        from: String(from),
        to: String(to),
      });
      if (json.error) {
        return {
          provider: 'finnhub',
          status: 'error',
          cached: false,
          error: json.error,
          meta: { retryable: json.retryable, status: json.status },
        };
      }
      const points = (json.t || []).map((ts: number, idx: number) => ({
        timestamp: new Date(ts * 1000).toISOString(),
        open: json.o?.[idx] ?? null,
        high: json.h?.[idx] ?? null,
        low: json.l?.[idx] ?? null,
        close: json.c?.[idx] ?? null,
        volume: json.v?.[idx] ?? null,
      }));
      const timeseries = TimeseriesDTO.parse({ symbol: request.symbol, interval: '1d', points });
      return { provider: 'finnhub', status: 'ok', cached: false, timeseries, raw: json };
    }

    const json: any = await fetchJson('/stock/profile2', { symbol: request.symbol });
    if (json.error) {
      return {
        provider: 'finnhub',
        status: 'error',
        cached: false,
        error: json.error,
        meta: { retryable: json.retryable, status: json.status },
      };
    }
    const company = CompanyDTO.parse({
      symbol: request.symbol,
      name: json.name ?? null,
      sector: json.finnhubIndustry ?? null,
      industry: json.finnhubIndustry ?? null,
      website: json.weburl ?? null,
      description: json.description ?? null,
    });
    return { provider: 'finnhub', status: 'ok', cached: false, company, raw: json };
  } catch (error) {
    return {
      provider: 'finnhub',
      status: 'error',
      cached: false,
      error: error instanceof Error ? error.message : 'Failed to normalise Finnhub payload',
    };
  }
}
