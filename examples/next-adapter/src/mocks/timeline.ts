export interface TimelineEvent {
  id: string;
  ts: string;
  source: string;
  kind: string;
  title: string;
  detail?: string;
  severity?: 'info' | 'success' | 'warn' | 'error';
}

function minutesAgo(mins: number) {
  return new Date(Date.now() - mins * 60 * 1000).toISOString();
}

export const timelineMock: TimelineEvent[] = [
  { id: 'tl-01', ts: minutesAgo(6), source: 'ingest', kind: 'ingest.convert', title: 'Converted VentureDeck.pdf → 14 assets', severity: 'success' },
  { id: 'tl-02', ts: minutesAgo(18), source: 'search', kind: 'search.query', title: 'Query “narco nations go-to-market”', detail: 'Score 0.93', severity: 'info' },
  { id: 'tl-03', ts: minutesAgo(32), source: 'api', kind: 'api.alpha-probe', title: 'Alpha probe NARC.sentiment_delta executed', detail: 'Delta +2.8', severity: 'warn' },
  { id: 'tl-04', ts: minutesAgo(48), source: 'knowledge', kind: 'knowledge.index', title: 'Indexed contraband-supply-lines', severity: 'success' },
  { id: 'tl-05', ts: minutesAgo(61), source: 'workroom', kind: 'workroom.export', title: 'Workroom board “Ops war-room” exported', severity: 'success' },
  { id: 'tl-06', ts: minutesAgo(74), source: 'corpus', kind: 'corpus.merge', title: 'Merged 22 encrypted chats', detail: 'Channel: field ops', severity: 'info' },
  { id: 'tl-07', ts: minutesAgo(90), source: 'search', kind: 'search.snapshot', title: 'Pinned snapshot “sentiment delta”', severity: 'info' },
  { id: 'tl-08', ts: minutesAgo(118), source: 'api', kind: 'api.llm-probe', title: 'LLM probe “counterintel summary” finished', severity: 'success' },
  { id: 'tl-09', ts: minutesAgo(146), source: 'ingest', kind: 'ingest.chatgpt', title: 'Chat export gtm-war-room hydrated', severity: 'success' },
  { id: 'tl-10', ts: minutesAgo(175), source: 'knowledge', kind: 'knowledge.refresh', title: 'Refreshed founder-insights-2024', severity: 'info' },
  { id: 'tl-11', ts: minutesAgo(220), source: 'timeline', kind: 'historian.alert', title: 'Latency spike on alpha feed', detail: 'Resolved in 2m', severity: 'warn' },
  { id: 'tl-12', ts: minutesAgo(260), source: 'search', kind: 'search.query', title: 'Query “social payload schedule”', severity: 'info' },
  { id: 'tl-13', ts: minutesAgo(300), source: 'api', kind: 'api.alpha-probe', title: 'Alpha feed fallback engaged', severity: 'error', detail: 'switching to backup region' },
];
