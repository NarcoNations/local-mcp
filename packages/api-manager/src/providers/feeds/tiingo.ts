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
import type { FeedProvider, ProviderExecutionContext } from './types.js';

const API_URL = 'https://api.tiingo.com';

function requireKey() {
  const key = process.env.TIINGO_KEY ?? process.env.TIINGO_API_KEY;
  if (!key) {
    throw new ProviderError('TIINGO_KEY not set');
  }
  return key;
}

async function request(path: string, query: Record<string, string>, ctx: ProviderExecutionContext) {
  const url = new URL(`${API_URL}${path}`);
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value);
  }
  const headers = { Authorization: `Token ${requireKey()}` };
  const response = await fetchWithRetry(url.toString(), { headers }, { fetcher: ctx.fetcher });
  if (!response.ok) {
    throw new ProviderError('Tiingo request failed', { status: response.status });
  }
  return response.json();
}

async function getQuote(symbol: string, ctx: ProviderExecutionContext): Promise<FeedResult<QuoteDTO>> {
  const json = await request('/iex', { tickers: symbol }, ctx);
  if (!Array.isArray(json) || json.length === 0) {
    throw new ProviderError('Quote unavailable', { status: 404 });
  }
  const quote = json[0];
  const parsed = QuoteSchema.parse({
    symbol: quote.ticker ?? symbol,
    price: Number(quote.last ?? quote.prevClose),
    open: quote.open ? Number(quote.open) : undefined,
    high: quote.high ? Number(quote.high) : undefined,
    low: quote.low ? Number(quote.low) : undefined,
    previousClose: quote.prevClose ? Number(quote.prevClose) : undefined,
    change: quote.last && quote.prevClose ? Number(quote.last) - Number(quote.prevClose) : undefined,
    changePercent:
      quote.last && quote.prevClose
        ? ((Number(quote.last) - Number(quote.prevClose)) / Number(quote.prevClose)) * 100
        : undefined,
    provider: 'tiingo',
    updatedAt: quote.timestamp ?? new Date().toISOString(),
    source: 'tiingo-iex',
  });
  return { data: parsed, provider: 'tiingo', cached: false, raw: quote };
}

async function getTimeseries(symbol: string, req: FeedRequest, ctx: ProviderExecutionContext): Promise<FeedResult<TimeseriesDTO>> {
  const params: Record<string, string> = {};
  if (req.range === 'compact') {
    const start = new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString().split('T')[0];
    params.startDate = start;
  }
  if (req.interval && req.interval !== '1d') {
    params.resampleFreq = req.interval;
  }
  const json = await request(`/tiingo/daily/${symbol}/prices`, params, ctx);
  if (!Array.isArray(json) || json.length === 0) {
    throw new ProviderError('Timeseries unavailable', { status: 404 });
  }
  const points = json.map((row: any) => ({
    timestamp: row.date,
    open: Number(row.open),
    high: Number(row.high),
    low: Number(row.low),
    close: Number(row.close ?? row.adjClose ?? row.open),
    volume: row.volume ? Number(row.volume) : undefined,
  }));
  const parsed = TimeseriesSchema.parse({
    symbol,
    provider: 'tiingo',
    granularity: (req.interval ?? '1d') as TimeseriesDTO['granularity'],
    points,
    meta: { source: 'tiingo/daily' },
  });
  return { data: parsed, provider: 'tiingo', cached: false, raw: json };
}

async function getCompany(symbol: string, ctx: ProviderExecutionContext): Promise<FeedResult<CompanyDTO>> {
  const json = await request(`/tiingo/daily/${symbol}`, {}, ctx);
  if (!json || !json.ticker) {
    throw new ProviderError('Company profile unavailable', { status: 404 });
  }
  const parsed = CompanySchema.parse({
    symbol: json.ticker ?? symbol,
    provider: 'tiingo',
    name: json.name ?? symbol,
    description: json.description ?? undefined,
    exchange: json.exchange ?? undefined,
    industry: json.industry ?? undefined,
    sector: json.sector ?? undefined,
    website: json.webSite ?? undefined,
    country: json.country ?? undefined,
    employees: json.employees ? Number(json.employees) : undefined,
    ipoDate: json.startDate ?? undefined,
    currency: json.currency ?? undefined,
  });
  return { data: parsed, provider: 'tiingo', cached: false, raw: json };
}

export const tiingoProvider: FeedProvider = {
  id: 'tiingo',
  name: 'Tiingo',
  supports: { quote: true, timeseries: true, company: true },
  getQuote,
  getTimeseries,
  getCompany,
};

