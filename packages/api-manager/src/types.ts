export type FeedRequest = { symbol: string; fn: 'TIME_SERIES_DAILY' | 'OVERVIEW' };
export type FeedResponse = unknown;
export type LLMTask = 'draft_copy' | 'summarize' | 'classify';
export type LLMRun = { task: LLMTask; prompt: string; modelHint?: string };
