export type FeedRequest = { symbol: string; fn: "TIME_SERIES_DAILY" | "OVERVIEW" };
export type FeedResponse = unknown;

export type LLMTask = "draft_copy" | "summarize" | "classify" | "chat" | "analyze";

export interface LLMModelDescriptor {
  id: string;
  label?: string;
  description?: string;
  tags?: string[];
  contextLength?: number;
  metadata?: Record<string, unknown>;
}

export interface LLMProviderDescriptor {
  id: string;
  type: string;
  label: string;
  description?: string;
  available: boolean;
  disabledReason?: string;
  models: LLMModelDescriptor[];
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface LLMRunRequest {
  task: LLMTask;
  prompt: string;
  modelHint?: string;
  model?: string;
  providerId?: string;
  metadata?: Record<string, unknown>;
  cacheKey?: string;
  cacheTtlSeconds?: number;
  useCache?: boolean;
  user?: string;
}

export type LLMRun = LLMRunRequest;

export interface LLMRunResult {
  providerId: string;
  providerLabel?: string;
  model: string;
  output: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    cached?: boolean;
    cost?: number;
    currency?: string;
  };
  cached?: boolean;
  raw?: unknown;
  durationMs?: number;
  metadata?: Record<string, unknown>;
}

export interface CacheAdapter<T> {
  get(key: string): Promise<T | undefined> | T | undefined;
  set(key: string, value: T, ttlSeconds?: number): Promise<void> | void;
  delete?(key: string): Promise<void> | void;
}

export interface ProviderInvokeOptions {
  signal?: AbortSignal;
  metadata?: Record<string, unknown>;
}

export interface LLMProvider {
  readonly descriptor: LLMProviderDescriptor;
  canHandle(request: LLMRunRequest): boolean;
  invoke(request: LLMRunRequest, options?: ProviderInvokeOptions): Promise<LLMRunResult>;
}

export interface CacheConfig {
  ttlSeconds?: number;
  maxEntries?: number;
}

interface BaseProviderConfig {
  id: string;
  type: string;
  label?: string;
  description?: string;
  disabled?: boolean;
  disabledReason?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface OpenAIProviderConfig extends BaseProviderConfig {
  type: "openai";
  apiKey?: string;
  apiKeyEnv?: string;
  baseUrl?: string;
  organization?: string;
  defaultModel?: string;
  models?: string[];
  temperature?: number;
}

export interface LocalProviderConfig extends BaseProviderConfig {
  type: "local";
  models?: string[];
  endpoint?: string;
  defaultResponsePrefix?: string;
}

export interface GenericLLMProviderConfig extends Omit<BaseProviderConfig, "type"> {
  type: Exclude<string, "openai" | "local">;
  options?: Record<string, unknown>;
  models?: string[];
}

export type LLMProviderConfig = OpenAIProviderConfig | LocalProviderConfig | GenericLLMProviderConfig;

export interface LLMManagerConfig {
  defaultProvider?: string;
  fallbackProvider?: string;
  cache?: CacheConfig;
  cacheSeconds?: number;
  providers: LLMProviderConfig[];
}

export interface ApiManagerConfig {
  llm: LLMManagerConfig;
}

export interface LLMPolicyDecision {
  providerId?: string;
  model?: string;
  useCache?: boolean;
  cacheKey?: string;
  cacheTtlSeconds?: number;
  metadata?: Record<string, unknown>;
}

export type LLMPolicy = (
  input: { request: LLMRunRequest; providers: LLMProviderDescriptor[] }
) => Promise<LLMPolicyDecision | null | undefined> | LLMPolicyDecision | null | undefined;

export interface ApiManagerOptions {
  cache?: CacheAdapter<LLMRunResult>;
  llmPolicy?: LLMPolicy;
}

export interface ApiManager {
  listLLMProviders(options?: { includeUnavailable?: boolean }): LLMProviderDescriptor[];
  runLLM(request: LLMRunRequest, options?: { signal?: AbortSignal }): Promise<LLMRunResult>;
}
