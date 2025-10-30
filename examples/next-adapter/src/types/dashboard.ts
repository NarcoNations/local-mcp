export interface HistorianEvent {
  id: string;
  source: string;
  kind: string;
  ts: string;
  summary: string;
  severity?: 'info' | 'warn' | 'error';
}

export interface IngestConversion {
  id: string;
  slug: string;
  files: number;
  storage: 'hot' | 'cold';
  status: 'completed' | 'processing' | 'failed';
  updatedAt: string;
}

export interface CorpusStats {
  conversations: number;
  messages: number;
  lastIndexedAt: string;
}

export interface KnowledgeEntry {
  id: string;
  slug: string;
  createdAt: string;
  files: number;
}

export interface DashboardData {
  historian: HistorianEvent[];
  ingest: IngestConversion[];
  corpus: CorpusStats;
  knowledge: KnowledgeEntry[];
  searchRecent: Array<{ id: string; query: string; ts: string }>;
}
