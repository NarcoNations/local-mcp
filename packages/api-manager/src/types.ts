import { z } from 'zod';

export const QuoteDTO = z.object({
  symbol: z.string(),
  price: z.number().nullable(),
  open: z.number().nullable(),
  high: z.number().nullable(),
  low: z.number().nullable(),
  previousClose: z.number().nullable(),
  change: z.number().nullable(),
  changePercent: z.number().nullable(),
  currency: z.string().nullable().default('USD'),
  timestamp: z.string(),
});

export const TimeseriesPointDTO = z.object({
  timestamp: z.string(),
  open: z.number().nullable(),
  high: z.number().nullable(),
  low: z.number().nullable(),
  close: z.number().nullable(),
  volume: z.number().nullable(),
});

export const TimeseriesDTO = z.object({
  symbol: z.string(),
  interval: z.string().default('1d'),
  points: z.array(TimeseriesPointDTO),
});

export const CompanyDTO = z.object({
  symbol: z.string(),
  name: z.string().nullable(),
  sector: z.string().nullable(),
  industry: z.string().nullable(),
  website: z.string().url().nullable().or(z.literal('')).transform((val) => (val === '' ? null : val)),
  description: z.string().nullable(),
});

export type Quote = z.infer<typeof QuoteDTO>;
export type Timeseries = z.infer<typeof TimeseriesDTO>;
export type Company = z.infer<typeof CompanyDTO>;

export type FeedProvider = 'alpha-vantage' | 'finnhub' | 'tiingo';

export type FeedRequest = {
  provider: FeedProvider;
  symbol: string;
  resource: 'quote' | 'timeseries' | 'company';
  interval?: string;
  range?: string;
};

export type FeedResponse = {
  quote?: Quote;
  timeseries?: Timeseries;
  company?: Company;
  raw?: unknown;
  provider: FeedProvider;
  cached: boolean;
  cacheSource?: 'memory' | 'supabase';
  status: 'ok' | 'error';
  error?: string;
  meta?: Record<string, unknown>;
};

export type LLMTask =
  | 'draft_copy'
  | 'summarize'
  | 'classify'
  | 'research_plan'
  | 'narrative_draft'
  | 'code_review';

export type LLMRun = {
  task: LLMTask;
  prompt: string;
  modelHint?: string;
  metadata?: Record<string, unknown>;
};
