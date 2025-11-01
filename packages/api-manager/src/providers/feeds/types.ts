import type { CacheClient, FeedRequest, FeedResult, ProviderId, QuoteDTO, TimeseriesDTO, CompanyDTO } from '../../types.js';

export interface ProviderContext {
  cache?: CacheClient;
  fetcher?: typeof fetch;
  ttlSeconds?: number;
}

export interface FeedProvider {
  id: ProviderId;
  name: string;
  supports: {
    quote?: boolean;
    timeseries?: boolean;
    company?: boolean;
  };
  getQuote?(symbol: string, ctx: ProviderExecutionContext): Promise<FeedResult<QuoteDTO>>;
  getTimeseries?(symbol: string, request: FeedRequest, ctx: ProviderExecutionContext): Promise<FeedResult<TimeseriesDTO>>;
  getCompany?(symbol: string, ctx: ProviderExecutionContext): Promise<FeedResult<CompanyDTO>>;
}

export interface ProviderExecutionContext {
  fetcher: typeof fetch;
  cache?: CacheClient;
  ttlSeconds: number;
  request: FeedRequest;
}

export type ProviderRegistry = Record<ProviderId, FeedProvider>;

