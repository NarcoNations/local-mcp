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

const API_URL = 'https://finnhub.io/api/v1';

function requireKey() {
  const key = process.env.FINNHUB_KEY ?? process.env.FINNHUB_API_KEY;
  if (!key) {
    throw new ProviderError('FINNHUB_KEY not set');
  }
  return key;
}

async function request(path: string, query: Record<string, string>, ctx: ProviderExecutionContext) {
  const url = new URL(`${API_URL}${path}`);
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set('token', requireKey());
  const response = await fetchWithRetry(url.toString(), undefined, { fetcher: ctx.fetcher });
  if (!response.ok) {
    throw new ProviderError('Finnhub request failed', { status: response.status });
  }
  return response.json();
}

async function getQuote(symbol: string, ctx: ProviderExecutionContext): Promise<FeedResult<QuoteDTO>> {
  const json = await request('/quote', { symbol }, ctx);
  if (!json || json.c === undefined) {
    throw new ProviderError('Quote unavailable', { status: 404 });
  }
  const parsed = QuoteSchema.parse({
    symbol,
    price: Number(json.c),
    open: json.o ? Number(json.o) : undefined,
    high: json.h ? Number(json.h) : undefined,
    low: json.l ? Number(json.l) : undefined,
    previousClose: json.pc ? Number(json.pc) : undefined,
    change: json.d ? Number(json.d) : undefined,
    changePercent: json.dp ? Number(json.dp) : undefined,
    provider: 'finnhub',
    updatedAt: json.t ? new Date(json.t * 1000).toISOString() : new Date().toISOString(),
    source: 'finnhub',
  });
  return { data: parsed, provider: 'finnhub', cached: false, raw: json };
}

const FINNHUB_INTERVAL_MAP: Record<string, string> = {
  '1min': '1',
  '5min': '5',
  '15min': '15',
  '30min': '30',
  '1h': '60',
  '1d': 'D',
  '1wk': 'W',
  '1mo': 'M',
};

async function getTimeseries(symbol: string, req: FeedRequest, ctx: ProviderExecutionContext): Promise<FeedResult<TimeseriesDTO>> {
  const resolution = FINNHUB_INTERVAL_MAP[req.interval ?? '1d'] ?? 'D';
  const now = Math.floor(Date.now() / 1000);
  const lookback = req.range === 'compact' ? now - 60 * 60 * 24 * 30 : now - 60 * 60 * 24 * 365;
  const json = await request('/stock/candle', { symbol, resolution, from: String(lookback), to: String(now) }, ctx);
  if (json.s !== 'ok') {
    throw new ProviderError('Timeseries unavailable', { status: 404 });
  }
  const points = (json.t as number[]).map((timestamp, index) => ({
    timestamp: new Date(timestamp * 1000).toISOString(),
    open: Number(json.o[index]),
    high: Number(json.h[index]),
    low: Number(json.l[index]),
    close: Number(json.c[index]),
    volume: json.v ? Number(json.v[index]) : undefined,
  }));
  const parsed = TimeseriesSchema.parse({
    symbol,
    provider: 'finnhub',
    granularity: (req.interval ?? '1d') as TimeseriesDTO['granularity'],
    points,
    meta: { resolution },
  });
  return { data: parsed, provider: 'finnhub', cached: false, raw: json };
}

async function getCompany(symbol: string, ctx: ProviderExecutionContext): Promise<FeedResult<CompanyDTO>> {
  const json = await request('/stock/profile2', { symbol }, ctx);
  if (!json.name) {
    throw new ProviderError('Company profile unavailable', { status: 404 });
  }
  const parsed = CompanySchema.parse({
    symbol: json.ticker ?? symbol,
    provider: 'finnhub',
    name: json.name ?? symbol,
    description: json.description ?? undefined,
    exchange: json.exchange ?? undefined,
    industry: json.finnhubIndustry ?? undefined,
    sector: json.gicsSector ?? undefined,
    website: json.weburl ?? undefined,
    country: json.country ?? undefined,
    employees: json.employeeTotal ? Number(json.employeeTotal) : undefined,
    ipoDate: json.ipo ?? undefined,
    currency: json.currency ?? undefined,
  });
  return { data: parsed, provider: 'finnhub', cached: false, raw: json };
}

export const finnhubProvider: FeedProvider = {
  id: 'finnhub',
  name: 'Finnhub',
  supports: { quote: true, timeseries: true, company: true },
  getQuote,
  getTimeseries,
  getCompany,
};

