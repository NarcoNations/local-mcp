import { QuoteDTO, TimeseriesDTO, CompanyDTO, type FeedRequest, type FeedResponse } from '../../types';

const API_BASE = 'https://api.tiingo.com';

function getKey() {
  return process.env.TIINGO_KEY || process.env.TIINGO_API_KEY;
}

async function fetchJson(path: string, params: Record<string, string> = {}) {
  const apiKey = getKey();
  if (!apiKey) return { error: 'TIINGO_KEY is not configured' };
  const url = new URL(`${API_BASE}${path}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Token ${apiKey}`,
    },
  });
  if (res.status === 429) {
    return { error: 'Tiingo rate limit exceeded', retryable: true, status: res.status };
  }
  if (!res.ok) return { error: `Tiingo error ${res.status}` };
  return res.json();
}

export async function fetchTiingo(request: FeedRequest): Promise<FeedResponse> {
  const apiKey = getKey();
  if (!apiKey) {
    return {
      provider: 'tiingo',
      status: 'error',
      cached: false,
      error: 'TIINGO_KEY is not configured',
    };
  }

  try {
    if (request.resource === 'quote') {
      const json: any = await fetchJson(`/iex/${request.symbol}`);
      if (json.error) {
        return {
          provider: 'tiingo',
          status: 'error',
          cached: false,
          error: json.error,
          meta: { retryable: json.retryable, status: json.status },
        };
      }
      const first = Array.isArray(json) ? json[0] : json;
      const quote = QuoteDTO.parse({
        symbol: request.symbol,
        price: first?.last ?? null,
        open: first?.open ?? null,
        high: first?.high ?? null,
        low: first?.low ?? null,
        previousClose: first?.prevClose ?? null,
        change: first?.last && first?.prevClose ? first.last - first.prevClose : null,
        changePercent:
          first?.last && first?.prevClose ? ((first.last - first.prevClose) / first.prevClose) * 100 : null,
        currency: first?.currency ?? 'USD',
        timestamp: first?.timestamp ?? new Date().toISOString(),
      });
      return { provider: 'tiingo', status: 'ok', cached: false, quote, raw: json };
    }

    if (request.resource === 'timeseries') {
      const json: any = await fetchJson(`/tiingo/daily/${request.symbol}/prices`, {
        startDate: new Date(Date.now() - (request.range === 'compact' ? 30 : 365) * 86400000)
          .toISOString()
          .slice(0, 10),
        endDate: new Date().toISOString().slice(0, 10),
      });
      if (json.error) {
        return {
          provider: 'tiingo',
          status: 'error',
          cached: false,
          error: json.error,
          meta: { retryable: json.retryable, status: json.status },
        };
      }
      const points = (json || []).map((row: any) => ({
        timestamp: row.date,
        open: row.open ?? null,
        high: row.high ?? null,
        low: row.low ?? null,
        close: row.close ?? null,
        volume: row.volume ?? null,
      }));
      const timeseries = TimeseriesDTO.parse({ symbol: request.symbol, interval: '1d', points });
      return { provider: 'tiingo', status: 'ok', cached: false, timeseries, raw: json };
    }

    const json: any = await fetchJson(`/tiingo/daily/${request.symbol}`);
    if (json.error) {
      return {
        provider: 'tiingo',
        status: 'error',
        cached: false,
        error: json.error,
        meta: { retryable: json.retryable, status: json.status },
      };
    }
    const company = CompanyDTO.parse({
      symbol: request.symbol,
      name: json.name ?? null,
      sector: json.sector ?? null,
      industry: json.industry ?? null,
      website: json.website ?? null,
      description: json.description ?? null,
    });
    return { provider: 'tiingo', status: 'ok', cached: false, company, raw: json };
  } catch (error) {
    return {
      provider: 'tiingo',
      status: 'error',
      cached: false,
      error: error instanceof Error ? error.message : 'Failed to normalise Tiingo payload',
    };
  }
}
