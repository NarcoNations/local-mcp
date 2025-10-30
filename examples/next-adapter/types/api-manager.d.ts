declare module '@vibelabz/api-manager' {
  export type FeedRequest = { symbol: string; fn: 'TIME_SERIES_DAILY' | 'OVERVIEW' };
  export type FeedResponse = Record<string, unknown> | { error?: string; status?: number; mock?: boolean; note?: string; request?: FeedRequest };
  export type LLMTask = 'draft_copy' | 'summarize' | 'classify';
  export type LLMRun = { task: LLMTask; prompt: string; modelHint?: string };
  export type LLMResult = {
    model?: string;
    output?: string;
    mock?: boolean;
    error?: string;
    status?: number;
    note?: string;
    usage?: unknown;
  };
  export function fetchFeed(req: FeedRequest): Promise<FeedResponse>;
  export function runLLM(run: LLMRun): Promise<LLMResult>;
}
