import { quoteSchema, timeseriesSchema, companySchema } from '../../dto';
import type { FeedKind, FeedRequest, FeedResult } from '../../types';

const ALPHA_BASE = 'https://www.alphavantage.co/query';

type AlphaSeries = Record<string, Record<string, string>>;

function ensureKey() {
  const key = process.env.ALPHA_VANTAGE_KEY;
  if (!key) throw Object.assign(new Error('ALPHA_VANTAGE_KEY missing'), { status: 500 });
  return key;
}

async function callAlpha(params: Record<string, string>) {
  const key = ensureKey();
  const url = new URL(ALPHA_BASE);
  Object.entries({ ...params, apikey: key }).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  const status = res.status;
  if (!res.ok) throw Object.assign(new Error('alpha vantage request failed'), { status });
  const json = await res.json();
  if (json['Error Message'] || json.Note) {
    throw Object.assign(new Error(json['Error Message'] || json.Note || 'alpha vantage error'), { status: 429 });
  }
  return json;
}

function parseQuote(raw: any) {
  const data = raw?.['Global Quote'];
  if (!data) throw Object.assign(new Error('alpha vantage quote missing'), { status: 502 });
  return quoteSchema.parse({
    symbol: data['01. symbol'],
    price: Number(data['05. price'] ?? data['05. Price'] ?? 0),
    open: parseMaybe(data['02. open']),
    high: parseMaybe(data['03. high']),
    low: parseMaybe(data['04. low']),
    previousClose: parseMaybe(data['08. previous close']),
    change: parseMaybe(data['09. change']),
    changePercent: parsePercent(data['10. change percent']),
    volume: parseMaybe(data['06. volume']),
    currency: 'USD',
    asOf: new Date().toISOString()
  });
}

function parseSeries(kind: FeedKind, raw: any, symbol: string) {
  const key = kind === 'timeseries' ? Object.keys(raw).find((k) => k.toLowerCase().includes('time series')) : undefined;
  const data: AlphaSeries = key ? raw[key] : {};
  const entries = Object.entries(data || {});
  const points = entries.map(([date, values]) => ({
    time: new Date(date).toISOString(),
    open: parseMaybe(values['1. open']),
    high: parseMaybe(values['2. high']),
    low: parseMaybe(values['3. low']),
    close: parseMaybe(values['4. close'] || values['5. adjusted close']),
    volume: parseMaybe(values['6. volume'])
  }));
  const sorted = points.sort((a, b) => (a.time > b.time ? 1 : -1));
  return timeseriesSchema.parse({
    symbol,
    interval: '1d',
    start: sorted[0]?.time || new Date().toISOString(),
    end: sorted[sorted.length - 1]?.time || new Date().toISOString(),
    points: sorted
  });
}

function parseCompany(raw: any, symbol: string) {
  return companySchema.parse({
    symbol,
    name: raw?.Name ?? null,
    exchange: raw?.Exchange ?? null,
    industry: raw?.Industry ?? null,
    website: raw?.Website ?? null,
    description: raw?.Description ?? null,
    ceo: raw?.CEO ?? null,
    headquarters: raw?.Address ? `${raw.Address}, ${raw.City || ''}`.trim() : null,
    employees: raw?.FullTimeEmployees ? Number(raw.FullTimeEmployees) : null
  });
}

export async function fetchAlphaVantage(request: FeedRequest): Promise<FeedResult> {
  const { kind, symbol } = request;
  let response: any;
  let status = 200;
  try {
    if (kind === 'quote') {
      response = await callAlpha({ function: 'GLOBAL_QUOTE', symbol });
      return { provider: 'alphaVantage', kind, data: parseQuote(response), meta: baseMeta(request, status) };
    }
    if (kind === 'timeseries') {
      response = await callAlpha({ function: 'TIME_SERIES_DAILY_ADJUSTED', symbol });
      return { provider: 'alphaVantage', kind, data: parseSeries(kind, response, symbol), meta: baseMeta(request, status) };
    }
    response = await callAlpha({ function: 'OVERVIEW', symbol });
    return { provider: 'alphaVantage', kind, data: parseCompany(response, symbol), meta: baseMeta(request, status) };
  } catch (err: any) {
    status = err?.status ?? 500;
    return { provider: 'alphaVantage', kind, meta: baseMeta(request, status), error: { message: err?.message || 'alpha vantage error' } };
  }
}

function parseMaybe(input: string | undefined) {
  if (input === undefined || input === null) return null;
  const num = Number(String(input).replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(num) ? num : null;
}

function parsePercent(input: string | undefined) {
  if (!input) return null;
  const cleaned = input.replace('%', '');
  return parseMaybe(cleaned);
}

function baseMeta(request: FeedRequest, status: number) {
  return {
    cache: 'network' as const,
    cached: false,
    key: `${request.provider}:${request.kind}:${request.symbol}`,
    requestedAt: new Date().toISOString(),
    latencyMs: 0,
    status
  };
}
