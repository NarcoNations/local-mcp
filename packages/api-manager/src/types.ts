import type { CompanyDTO, QuoteDTO, TimeseriesDTO } from './dto';

export type FeedProvider = 'alphaVantage' | 'finnhub' | 'tiingo' | 'polygon';
export type FeedKind = 'quote' | 'timeseries' | 'company';

export type FeedRequest = {
  provider: FeedProvider;
  kind: FeedKind;
  symbol: string;
  interval?: '1d' | '1w' | '1m' | '3m';
  range?: string;
};

export type FeedOptions = {
  ttlMs?: number;
  cacheKeyPrefix?: string;
  supabase?: { url: string; serviceKey: string } | null;
  maxEntries?: number;
};

export type FeedData = QuoteDTO | TimeseriesDTO | CompanyDTO;

export type FeedResult<T = FeedData> = {
  provider: FeedProvider;
  kind: FeedKind;
  data?: T;
  meta: {
    cache: 'memory' | 'supabase' | 'network' | 'none';
    cached: boolean;
    key: string;
    requestedAt: string;
    latencyMs: number;
    status: number;
  };
  error?: { message: string; details?: unknown };
};

export type LLMTask = 'draft_copy' | 'summarize' | 'classify' | 'plan' | 'narrative' | 'analysis';
export type LLMRun = { task: LLMTask; prompt: string; modelHint?: string; metadata?: Record<string, unknown> };

export type LLMResult = {
  task: LLMTask;
  model: string;
  output?: string;
  ok: boolean;
  costEstimate: number;
  latencyMs: number;
  promptHash: string;
  policy: {
    chosen: string;
    attempted: string[];
    fallbackUsed: boolean;
  };
  error?: string;
};
