import { fetchWithRetry } from '../../lib/http.js';
import {
  CompanySchema,
  ProviderError,
  QuoteSchema,
  TimeseriesSchema,
  type FeedRequest,
  type FeedResult,
  type QuoteDTO,
  type TimeseriesDTO,
  type CompanyDTO,
} from '../../types.js';
import type { ProviderExecutionContext, FeedProvider } from './types.js';

const API_URL = 'https://www.alphavantage.co/query';

function requireKey() {
  const key = process.env.ALPHA_VANTAGE_KEY ?? process.env.ALPHA_VANTAGE_API_KEY;
  if (!key) {
    throw new ProviderError('ALPHA_VANTAGE_KEY not set');
  }
  return key;
}

async function requestAlpha(query: Record<string, string>, ctx: ProviderExecutionContext) {
  const url = new URL(API_URL);
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set('apikey', requireKey());
  const response = await fetchWithRetry(url.toString(), undefined, { fetcher: ctx.fetcher });
  const json = await response.json();
  if (json['Note']) {
    throw new ProviderError('Alpha Vantage rate limit hit', { status: 429, retryAfterMs: 60_000 });
  }
  return json;
}

async function getQuote(symbol: string, ctx: ProviderExecutionContext): Promise<FeedResult<QuoteDTO>> {
  const json = await requestAlpha({ function: 'GLOBAL_QUOTE', symbol }, ctx);
  const quote = json['Global Quote'];
  if (!quote) {
    throw new ProviderError('Quote unavailable', { status: 404 });
  }
  const parsed = QuoteSchema.parse({
    symbol: quote['01. symbol'] ?? symbol,
    price: Number(quote['05. price'] ?? quote['02. open'] ?? 0),
    currency: quote['08. currency'] ?? undefined,
    open: quote['02. open'] ? Number(quote['02. open']) : undefined,
    high: quote['03. high'] ? Number(quote['03. high']) : undefined,
    low: quote['04. low'] ? Number(quote['04. low']) : undefined,
    previousClose: quote['08. previous close'] ? Number(quote['08. previous close']) : undefined,
    change: quote['09. change'] ? Number(quote['09. change']) : undefined,
    changePercent: quote['10. change percent'] ? Number(String(quote['10. change percent']).replace('%', '')) : undefined,
    provider: 'alpha',
    updatedAt: quote['07. latest trading day'] ?? new Date().toISOString(),
    source: 'alpha-vantage',
  });
  return { data: parsed, provider: 'alpha', cached: false, raw: quote };
}

function resolveFunction(req: FeedRequest) {
  if (req.interval && req.interval !== '1d') {
    return 'TIME_SERIES_INTRADAY';
  }
  return 'TIME_SERIES_DAILY';
}

async function getTimeseries(symbol: string, req: FeedRequest, ctx: ProviderExecutionContext): Promise<FeedResult<TimeseriesDTO>> {
  const func = resolveFunction(req);
  const json = await requestAlpha({
    function: func,
    symbol,
    ...(req.interval && req.interval !== '1d' ? { interval: req.interval } : {}),
    outputsize: req.range === 'compact' ? 'compact' : 'full',
  }, ctx);

  const key = func === 'TIME_SERIES_DAILY' ? 'Time Series (Daily)' : `Time Series (${req.interval ?? '5min'})`;
  const series: Record<string, any> = json[key];
  if (!series) {
    throw new ProviderError('Timeseries unavailable', { status: 404 });
  }
  const points = Object.entries(series)
    .map(([timestamp, values]) => ({
      timestamp,
      open: Number(values['1. open']),
      high: Number(values['2. high']),
      low: Number(values['3. low']),
      close: Number(values['4. close']),
      volume: values['5. volume'] ? Number(values['5. volume']) : undefined,
    }))
    .sort((a, b) => (a.timestamp > b.timestamp ? 1 : -1));

  const parsed = TimeseriesSchema.parse({
    symbol,
    provider: 'alpha',
    granularity: req.interval && req.interval !== '1d' ? (req.interval as TimeseriesDTO['granularity']) : '1d',
    points,
    meta: json['Meta Data'] ?? undefined,
  });
  return { data: parsed, provider: 'alpha', cached: false, raw: json };
}

async function getCompany(symbol: string, ctx: ProviderExecutionContext): Promise<FeedResult<CompanyDTO>> {
  const json = await requestAlpha({ function: 'OVERVIEW', symbol }, ctx);
  if (!json.Symbol) {
    throw new ProviderError('Company profile unavailable', { status: 404 });
  }
  const parsed = CompanySchema.parse({
    symbol: json.Symbol ?? symbol,
    provider: 'alpha',
    name: json.Name ?? symbol,
    description: json.Description ?? undefined,
    exchange: json.Exchange ?? undefined,
    industry: json.Industry ?? undefined,
    sector: json.Sector ?? undefined,
    website: json.Website && json.Website.startsWith('http') ? json.Website : undefined,
    country: json.Country ?? undefined,
    employees: json.FullTimeEmployees ? Number(json.FullTimeEmployees) : undefined,
    ipoDate: json.IPODate ?? undefined,
    currency: json.Currency ?? undefined,
  });
  return { data: parsed, provider: 'alpha', cached: false, raw: json };
}

export const alphaProvider: FeedProvider = {
  id: 'alpha',
  name: 'Alpha Vantage',
  supports: { quote: true, timeseries: true, company: true },
  getQuote,
  getTimeseries,
  getCompany,
};

