import { z } from 'zod';

export const ProviderIdSchema = z.enum(['alpha', 'finnhub', 'tiingo', 'polygon']);
export type ProviderId = z.infer<typeof ProviderIdSchema>;

export const FeedResourceSchema = z.enum(['quote', 'timeseries', 'company']);
export type FeedResource = z.infer<typeof FeedResourceSchema>;

export const QuoteSchema = z.object({
  symbol: z.string(),
  price: z.number(),
  currency: z.string().optional(),
  open: z.number().optional(),
  high: z.number().optional(),
  low: z.number().optional(),
  previousClose: z.number().optional(),
  change: z.number().optional(),
  changePercent: z.number().optional(),
  provider: ProviderIdSchema,
  updatedAt: z.string(),
  source: z.string().optional(),
});
export type QuoteDTO = z.infer<typeof QuoteSchema>;

export const TimeseriesPointSchema = z.object({
  timestamp: z.string(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.number().optional(),
});

export const TimeseriesSchema = z.object({
  symbol: z.string(),
  provider: ProviderIdSchema,
  granularity: z.enum(['1min', '5min', '15min', '30min', '1h', '1d', '1wk', '1mo']),
  points: z.array(TimeseriesPointSchema).min(1),
  meta: z.record(z.any()).optional(),
});
export type TimeseriesDTO = z.infer<typeof TimeseriesSchema>;

export const CompanySchema = z.object({
  symbol: z.string(),
  provider: ProviderIdSchema,
  name: z.string(),
  description: z.string().optional(),
  exchange: z.string().optional(),
  industry: z.string().optional(),
  sector: z.string().optional(),
  website: z.string().url().optional(),
  country: z.string().optional(),
  employees: z.number().int().nonnegative().optional(),
  ipoDate: z.string().optional(),
  currency: z.string().optional(),
});
export type CompanyDTO = z.infer<typeof CompanySchema>;

export const FeedRequestSchema = z.object({
  provider: ProviderIdSchema,
  resource: FeedResourceSchema,
  symbol: z.string().min(1),
  range: z.string().optional(),
  interval: z.string().optional(),
  forceRefresh: z.boolean().optional(),
});
export type FeedRequest = z.infer<typeof FeedRequestSchema>;

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export interface CacheClient {
  get<T>(key: string): Promise<T | null> | T | null;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void> | void;
}

export type LLMTask = 'draft_copy' | 'summarize' | 'classify';
export const LLMRunSchema = z.object({
  task: z.enum(['draft_copy', 'summarize', 'classify']),
  prompt: z.string().min(1),
  modelHint: z.string().optional(),
});
export type LLMRun = z.infer<typeof LLMRunSchema>;

export interface LLMPolicyModel {
  provider: 'openai' | 'local';
  model: string;
  maxCost?: number;
  maxLatencyMs?: number;
  fallback?: string;
}

export interface LLMPolicyConfig {
  tasks: Record<LLMTask | 'default', { primary: LLMPolicyModel; secondary?: LLMPolicyModel; local?: LLMPolicyModel }>;
}

export interface PromptRunRecord {
  id: string;
  task: LLMTask;
  model: string;
  provider: string;
  promptHash: string;
  costEst: number;
  latencyMs: number;
  ok: boolean;
  outputPreview: string;
  createdAt: string;
  meta?: Record<string, unknown>;
}

export interface LLMRunResult {
  model: string;
  provider: string;
  output?: string;
  error?: string;
  latencyMs: number;
  costEst: number;
  cached?: boolean;
}


export type FeedDTO = QuoteDTO | TimeseriesDTO | CompanyDTO;

export interface FeedResult<T extends FeedDTO = FeedDTO> {
  data: T;
  provider: ProviderId;
  cached: boolean;
  receivedAt?: string;
  raw?: unknown;
}

export class ProviderError extends Error {
  status?: number;
  retryAfterMs?: number;
  constructor(message: string, options?: { status?: number; retryAfterMs?: number }) {
    super(message);
    this.name = 'ProviderError';
    this.status = options?.status;
    this.retryAfterMs = options?.retryAfterMs;
  }
}

