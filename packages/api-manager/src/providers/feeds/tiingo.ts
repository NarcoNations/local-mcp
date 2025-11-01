import { companySchema, quoteSchema, timeseriesSchema } from '../../dto';
import type { FeedRequest, FeedResult } from '../../types';

const TIINGO_BASE = 'https://api.tiingo.com';

function ensureKey() {
  const key = process.env.TIINGO_KEY;
  if (!key) throw Object.assign(new Error('TIINGO_KEY missing'), { status: 500 });
  return key;
}

async function fetchJson(path: string, params: Record<string, string | number> = {}) {
  const key = ensureKey();
  const url = new URL(TIINGO_BASE + path);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Token ${key}` }
  });
  if (!res.ok) throw Object.assign(new Error('tiingo request failed'), { status: res.status });
  return res.json();
}

export async function fetchTiingo(request: FeedRequest): Promise<FeedResult> {
  const { kind, symbol } = request;
  let status = 200;
  try {
    if (kind === 'quote') {
      const data: any[] = await fetchJson(`/iex/${symbol}`);
      const first = Array.isArray(data) ? data[0] : null;
      if (!first) throw Object.assign(new Error('no tiingo quote'), { status: 404 });
      return {
        provider: 'tiingo',
        kind,
        data: quoteSchema.parse({
          symbol,
          price: Number(first.last ?? first.tngoLast ?? 0),
          open: first.open ?? null,
          high: first.high ?? null,
          low: first.low ?? null,
          previousClose: first.prevClose ?? null,
          change: first.last - (first.prevClose ?? first.open ?? first.last ?? 0),
          changePercent: first.prevClose ? ((first.last - first.prevClose) / first.prevClose) * 100 : null,
          volume: first.volume ?? null,
          currency: 'USD',
          asOf: new Date(first.timestamp || first.quoteTimestamp || Date.now()).toISOString()
        }),
        meta: baseMeta(request, status)
      };
    }
    if (kind === 'timeseries') {
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - 6);
      const prices: any[] = await fetchJson(`/tiingo/daily/${symbol}/prices`, {
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10)
      });
      const points = (prices || []).map((row: any) => ({
        time: new Date(row.date).toISOString(),
        open: row.open ?? null,
        high: row.high ?? null,
        low: row.low ?? null,
        close: row.close ?? null,
        volume: row.volume ?? null
      }));
      return {
        provider: 'tiingo',
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
    const company: any = await fetchJson(`/tiingo/daily/${symbol}`);
    return {
      provider: 'tiingo',
      kind,
      data: companySchema.parse({
        symbol,
        name: company.name ?? null,
        exchange: company.exchangeCode ?? null,
        industry: company.description ?? null,
        website: company.weburl ?? null,
        description: company.statement ?? null,
        ceo: company.ceo ?? null,
        headquarters: company.city ? `${company.city}, ${company.state || ''}`.trim() : null,
        employees: company.employees ?? null
      }),
      meta: baseMeta(request, status)
    };
  } catch (err: any) {
    status = err?.status ?? 500;
    return { provider: 'tiingo', kind, meta: baseMeta(request, status), error: { message: err?.message || 'tiingo error' } };
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
