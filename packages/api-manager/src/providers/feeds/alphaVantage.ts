import { QuoteDTO, TimeseriesDTO, CompanyDTO, type FeedRequest, type FeedResponse } from '../../types';

function getKey() {
  return process.env.ALPHA_VANTAGE_KEY || process.env.ALPHA_VANTAGE_API_KEY;
}

export async function fetchAlphaVantage(request: FeedRequest): Promise<FeedResponse> {
  const apiKey = getKey();
  if (!apiKey) {
    return {
      provider: 'alpha-vantage',
      status: 'error',
      cached: false,
      error: 'ALPHA_VANTAGE_KEY is not configured',
    };
  }

  const url = new URL('https://www.alphavantage.co/query');
  const resource = request.resource;

  if (resource === 'quote') {
    url.searchParams.set('function', 'GLOBAL_QUOTE');
    url.searchParams.set('symbol', request.symbol);
  } else if (resource === 'timeseries') {
    url.searchParams.set('function', 'TIME_SERIES_DAILY_ADJUSTED');
    url.searchParams.set('symbol', request.symbol);
    url.searchParams.set('outputsize', request.range === 'compact' ? 'compact' : 'full');
  } else if (resource === 'company') {
    url.searchParams.set('function', 'OVERVIEW');
    url.searchParams.set('symbol', request.symbol);
  }

  url.searchParams.set('apikey', apiKey);

  const res = await fetch(url.toString(), { headers: { 'Content-Type': 'application/json' } });
  if (!res.ok) {
    return {
      provider: 'alpha-vantage',
      status: 'error',
      cached: false,
      error: `Alpha Vantage responded with ${res.status}`,
      meta: { retryable: res.status === 429 || res.status >= 500 },
    };
  }

  const json = await res.json();

  if ('Note' in json) {
    return {
      provider: 'alpha-vantage',
      status: 'error',
      cached: false,
      error: json.Note,
      meta: { retryable: true },
    };
  }

  try {
    if (resource === 'quote') {
      const raw = json['Global Quote'] || {};
      const quote = QuoteDTO.parse({
        symbol: request.symbol,
        price: parseFloat(raw['05. price']) || null,
        open: parseFloat(raw['02. open']) || null,
        high: parseFloat(raw['03. high']) || null,
        low: parseFloat(raw['04. low']) || null,
        previousClose: parseFloat(raw['08. previous close']) || null,
        change: parseFloat(raw['09. change']) || null,
        changePercent: parseFloat((raw['10. change percent'] || '').replace('%', '')) || null,
        currency: (raw['07. latest trading day'] && 'USD') || 'USD',
        timestamp: raw['07. latest trading day'] || new Date().toISOString(),
      });
      return { provider: 'alpha-vantage', status: 'ok', cached: false, quote, raw: json };
    }

    if (resource === 'timeseries') {
      const key = 'Time Series (Daily)';
      const series = json[key] || {};
      const points = Object.entries(series).slice(0, 500).map(([date, values]: any) => ({
        timestamp: date,
        open: parseFloat(values['1. open']) || null,
        high: parseFloat(values['2. high']) || null,
        low: parseFloat(values['3. low']) || null,
        close: parseFloat(values['4. close']) || null,
        volume: parseFloat(values['6. volume']) || null,
      }));
      const timeseries = TimeseriesDTO.parse({
        symbol: request.symbol,
        interval: '1d',
        points,
      });
      return { provider: 'alpha-vantage', status: 'ok', cached: false, timeseries, raw: json };
    }

    const company = CompanyDTO.parse({
      symbol: request.symbol,
      name: json.Name ?? null,
      sector: json.Sector ?? null,
      industry: json.Industry ?? null,
      website: json.Website ?? null,
      description: json.Description ?? null,
    });
    return { provider: 'alpha-vantage', status: 'ok', cached: false, company, raw: json };
  } catch (error) {
    return {
      provider: 'alpha-vantage',
      status: 'error',
      cached: false,
      error: error instanceof Error ? error.message : 'Failed to normalise Alpha Vantage payload',
    };
  }
}
