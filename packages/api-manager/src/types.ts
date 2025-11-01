export type FeedDataset = 'timeSeriesDaily' | 'companyOverview';

export interface FeedRequest {
  symbol: string;
  dataset: FeedDataset;
  providerId?: string;
  forceRefresh?: boolean;
}

export interface TimeSeriesPoint {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface NormalizedTimeSeries {
  type: 'timeSeries';
  frequency: 'daily' | 'weekly' | 'intraday';
  points: TimeSeriesPoint[];
  updatedAt?: string;
}

export interface CompanyMetric {
  key: string;
  label: string;
  value: string | number | null;
}

export interface NormalizedOverview {
  type: 'overview';
  name?: string;
  description?: string;
  exchange?: string;
  currency?: string;
  sector?: string;
  industry?: string;
  website?: string;
  metrics: CompanyMetric[];
}

export type NormalizedFeedData = NormalizedTimeSeries | NormalizedOverview;

export interface NormalizedFeedResponse {
  symbol: string;
  dataset: FeedDataset;
  providerId: string;
  receivedAt: string;
  data: NormalizedFeedData;
  raw?: unknown;
  cacheTtlSeconds?: number;
}

export interface ProviderMetadata {
  id: string;
  label: string;
  description?: string;
}

export interface FeedProviderContext {
  credentials: ProviderCredentials;
  fetchImpl?: typeof fetch;
}

export interface ProviderCredentials {
  alphaVantage?: { apiKey?: string };
  polygon?: { apiKey?: string };
  tiingo?: { apiKey?: string };
  [key: string]: Record<string, string | undefined> | undefined;
}

export interface FeedProvider {
  metadata: ProviderMetadata;
  supports(request: FeedRequest): boolean;
  fetch(request: FeedRequest, context: FeedProviderContext): Promise<NormalizedFeedResponse>;
}

export type LLMTask = 'draft_copy' | 'summarize' | 'classify' | 'qa' | 'chat';

export interface LLMRun {
  task: LLMTask;
  prompt: string;
  modelHint?: string;
  metadata?: Record<string, unknown>;
  providerId?: string;
}

export interface LLMUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface NormalizedLLMResponse {
  providerId: string;
  model: string;
  task: LLMTask;
  output: string;
  latencyMs: number;
  usage?: LLMUsage;
  raw?: unknown;
  policyId?: string;
}

export interface LLMProviderContext {
  credentials: ProviderCredentials;
  fetchImpl?: typeof fetch;
}

export interface LLMRequest extends LLMRun {
  temperature?: number;
  maxTokens?: number;
  policyId?: string;
}

export interface LLMProvider {
  metadata: ProviderMetadata;
  supports(request: LLMRequest): boolean;
  invoke(request: LLMRequest, context: LLMProviderContext): Promise<NormalizedLLMResponse>;
}

export interface LLMPolicyRule {
  id: string;
  description?: string;
  match?: {
    tasks?: LLMTask[];
    modelHints?: string[];
    promptContains?: string[];
    providerIds?: string[];
  };
  target: {
    providerId: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  };
}

export interface LLMRoutingConfig {
  defaultProviderId: string;
  policies: LLMPolicyRule[];
  fallbackProviderId?: string;
}

export interface FeedCachingConfig {
  ttlSeconds: number;
  enabled: boolean;
}

export interface ApiManagerConfig {
  credentials: ProviderCredentials;
  feedCaching: FeedCachingConfig;
  llmRouting: LLMRoutingConfig;
}
