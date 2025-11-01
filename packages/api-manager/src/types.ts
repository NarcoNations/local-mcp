export type FeedFunction =
  | 'TIME_SERIES_DAILY'
  | 'OVERVIEW'
  | (string & {});

export interface FeedRequest {
  symbol: string;
  fn: FeedFunction;
  params?: Record<string, string | number | boolean | null | undefined>;
  disableCache?: boolean;
}

export interface NormalizedFeedSuccess<T = unknown> {
  ok: true;
  provider: string;
  data: T;
  receivedAt: string;
  cached?: boolean;
  meta?: Record<string, unknown>;
}

export interface NormalizedFeedError {
  ok: false;
  error: string;
  code?: string;
  provider?: string;
  cached?: boolean;
  details?: unknown;
  attempts?: ProviderAttemptError[];
}

export type FeedResponse<T = unknown> = NormalizedFeedSuccess<T> | NormalizedFeedError;

export type LLMTask = 'draft_copy' | 'summarize' | 'classify' | (string & {});

export interface LLMRun {
  task: LLMTask;
  prompt: string;
  modelHint?: string;
  disableCache?: boolean;
  metadata?: Record<string, unknown>;
}

export interface LLMProviderResult {
  model: string;
  output: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    [key: string]: unknown;
  };
  meta?: Record<string, unknown>;
}

export interface NormalizedLLMSuccess extends LLMProviderResult {
  ok: true;
  provider: string;
  cached?: boolean;
}

export interface ProviderAttemptError {
  provider: string;
  error: string;
  code?: string;
  details?: unknown;
}

export interface NormalizedLLMError {
  ok: false;
  error: string;
  code?: string;
  provider?: string;
  cached?: boolean;
  attempts?: ProviderAttemptError[];
}

export type LLMRunResult = NormalizedLLMSuccess | NormalizedLLMError;

export interface ProviderContext {
  signal?: AbortSignal;
  logger?: Pick<Console, 'debug' | 'info' | 'warn' | 'error'>;
}

export interface LLMProvider {
  readonly name: string;
  supports(run: LLMRun): boolean | Promise<boolean>;
  priority?(run: LLMRun): number | Promise<number>;
  invoke(run: LLMRun, context?: ProviderContext): Promise<LLMProviderResult>;
}

export interface FeedProvider {
  readonly name: string;
  supports(request: FeedRequest): boolean | Promise<boolean>;
  priority?(request: FeedRequest): number | Promise<number>;
  fetch(request: FeedRequest, context?: ProviderContext): Promise<unknown>;
}

export interface CacheAdapter {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T, ttlMs?: number): void;
  delete(key: string): void;
}

export interface CacheConfig {
  ttlMs?: number;
  maxEntries?: number;
}

export interface RoutingPolicy<TRequest, TProvider> {
  select(request: TRequest, providers: readonly TProvider[]): Promise<readonly TProvider[]>;
}

export interface ApiManagerOptions {
  cache?: CacheAdapter | CacheConfig | false;
  logger?: Pick<Console, 'debug' | 'info' | 'warn' | 'error'>;
  llm?: {
    providers?: readonly LLMProvider[];
    policy?: RoutingPolicy<LLMRun, LLMProvider>;
    cache?: CacheAdapter | CacheConfig | false;
  };
  feeds?: {
    providers?: readonly FeedProvider[];
    policy?: RoutingPolicy<FeedRequest, FeedProvider>;
    cache?: CacheAdapter | CacheConfig | false;
  };
}
