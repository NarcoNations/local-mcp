import type {
  FeedProvider,
  FeedRequest,
  FeedProviderContext,
  NormalizedFeedResponse,
  NormalizedTimeSeries,
  NormalizedOverview,
} from '../../types.js';

const DATASET_TO_FN: Record<FeedRequest['dataset'], string> = {
  timeSeriesDaily: 'TIME_SERIES_DAILY',
  companyOverview: 'OVERVIEW',
};

const TIME_SERIES_KEY = 'Time Series (Daily)';
const META_KEY = 'Meta Data';

function parseNumber(value: string | undefined | null): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const result = Number(value.replace(/,/g, ''));
  return Number.isFinite(result) ? result : undefined;
}

function extractTimeSeries(json: any): NormalizedTimeSeries {
  const series = json?.[TIME_SERIES_KEY];
  if (!series || typeof series !== 'object') {
    throw new Error('Alpha Vantage: time series data missing');
  }
  const points = Object.entries(series)
    .map(([timestamp, data]) => {
      const cast = data as Record<string, string>;
      return {
        timestamp,
        open: parseNumber(cast['1. open']) ?? 0,
        high: parseNumber(cast['2. high']) ?? 0,
        low: parseNumber(cast['3. low']) ?? 0,
        close: parseNumber(cast['4. close']) ?? 0,
        volume: parseNumber(cast['5. volume']),
      };
    })
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  const updatedAt = json?.[META_KEY]?.['3. Last Refreshed'];
  return { type: 'timeSeries', frequency: 'daily', points, updatedAt };
}

function extractOverview(json: any): NormalizedOverview {
  if (!json || typeof json !== 'object') {
    throw new Error('Alpha Vantage: overview data missing');
  }
  const metrics = [
    { key: 'MarketCapitalization', label: 'Market Cap' },
    { key: 'PERatio', label: 'PE Ratio' },
    { key: 'DividendYield', label: 'Dividend Yield' },
    { key: '52WeekHigh', label: '52 Week High' },
    { key: '52WeekLow', label: '52 Week Low' },
    { key: 'EBITDA', label: 'EBITDA' },
  ].map(({ key, label }) => ({
    key,
    label,
    value: json[key] ?? null,
  }));
  return {
    type: 'overview',
    name: json.Name,
    description: json.Description,
    exchange: json.Exchange,
    currency: json.Currency,
    sector: json.Sector,
    industry: json.Industry,
    website: json.Website,
    metrics,
  };
}

export class AlphaVantageProvider implements FeedProvider {
  readonly metadata = {
    id: 'alphaVantage',
    label: 'Alpha Vantage',
    description: 'Global equities via Alpha Vantage REST API.',
  } as const;

  supports(request: FeedRequest): boolean {
    return request.dataset in DATASET_TO_FN;
  }

  async fetch(request: FeedRequest, context: FeedProviderContext): Promise<NormalizedFeedResponse> {
    const apiKey = context.credentials.alphaVantage?.apiKey;
    if (!apiKey) {
      throw new Error('Alpha Vantage API key missing');
    }
    const fn = DATASET_TO_FN[request.dataset];
    const url = new URL('https://www.alphavantage.co/query');
    url.searchParams.set('function', fn);
    url.searchParams.set('symbol', request.symbol);
    url.searchParams.set('apikey', apiKey);

    const fetchImpl = context.fetchImpl ?? fetch;
    const res = await fetchImpl(url);
    if (!res.ok) {
      throw new Error(`Alpha Vantage request failed (${res.status})`);
    }
    const json = await res.json();
    if (json?.Note) {
      throw new Error(`Alpha Vantage rate limited: ${json.Note}`);
    }
    const data =
      request.dataset === 'timeSeriesDaily' ? extractTimeSeries(json) : extractOverview(json);
    return {
      symbol: request.symbol,
      dataset: request.dataset,
      providerId: this.metadata.id,
      receivedAt: new Date().toISOString(),
      data,
      raw: json,
      cacheTtlSeconds: request.dataset === 'timeSeriesDaily' ? 60 * 5 : 60 * 30,
    };
  }
}

export function createAlphaVantageProvider(): FeedProvider {
  return new AlphaVantageProvider();
}
