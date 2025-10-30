import { companySchema, quoteSchema, timeseriesSchema } from '../../dto';
import type { FeedRequest, FeedResult } from '../../types';

const FINNHUB_BASE = 'https://finnhub.io/api/v1';

function ensureKey() {
  const key = process.env.FINNHUB_KEY;
  if (!key) throw Object.assign(new Error('FINNHUB_KEY missing'), { status: 500 });
  return key;
}

async function fetchJson(path: string, params: Record<string, string | number>) {
  const key = ensureKey();
  const url = new URL(FINNHUB_BASE + path);
  Object.entries({ ...params, token: key }).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const res = await fetch(url.toString());
  if (!res.ok) throw Object.assign(new Error('finnhub request failed'), { status: res.status });
  const json = await res.json();
  if ((json as any)?.error) throw Object.assign(new Error(json.error), { status: res.status });
  return json;
}

export async function fetchFinnhub(request: FeedRequest): Promise<FeedResult> {
  const { kind, symbol } = request;
  let status = 200;
  try {
    if (kind === 'quote') {
      const data: any = await fetchJson('/quote', { symbol });
      return {
        provider: 'finnhub',
        kind,
        data: quoteSchema.parse({
          symbol,
          price: Number(data.c),
          open: data.o ?? null,
          high: data.h ?? null,
          low: data.l ?? null,
          previousClose: data.pc ?? null,
          change: data.d ?? null,
          changePercent: data.dp ?? null,
          volume: data.v ?? null,
          currency: 'USD',
          asOf: new Date((data.t || Date.now()) * 1000).toISOString()
        }),
        meta: baseMeta(request, status)
      };
    }
    if (kind === 'timeseries') {
      const candles: any = await fetchJson('/stock/candle', {
        symbol,
        resolution: 'D',
        count: 120
      });
      if (candles.s !== 'ok') throw Object.assign(new Error('no candle data'), { status: 404 });
      const points = (candles.t as number[]).map((timestamp: number, idx: number) => ({
        time: new Date(timestamp * 1000).toISOString(),
        open: candles.o?.[idx] ?? null,
        high: candles.h?.[idx] ?? null,
        low: candles.l?.[idx] ?? null,
        close: candles.c?.[idx] ?? null,
        volume: candles.v?.[idx] ?? null
      }));
      return {
        provider: 'finnhub',
        kind,
        data: timeseriesSchema.parse({
          symbol,
          interval: '1d',
          start: points[0]?.time || new Date().toISOString(),
          end: points[points.length - 1]?.time || new Date().toISOString(),
          points
        }),
        meta: baseMeta(request, status)
      };
    }
    const company: any = await fetchJson('/stock/profile2', { symbol });
    return {
      provider: 'finnhub',
      kind,
      data: companySchema.parse({
        symbol,
        name: company.name ?? null,
        exchange: company.exchange ?? null,
        industry: company.finnhubIndustry ?? null,
        website: company.weburl ?? null,
        description: company.description ?? null,
        ceo: company.ceo ?? null,
        headquarters: company.country ? `${company.city || ''} ${company.country}`.trim() : null,
        employees: company.employeeTotal ?? null
      }),
      meta: baseMeta(request, status)
    };
  } catch (err: any) {
    status = err?.status ?? 500;
    return { provider: 'finnhub', kind, meta: baseMeta(request, status), error: { message: err?.message || 'finnhub error' } };
  }
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
