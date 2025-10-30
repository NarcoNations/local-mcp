export interface QuickAction {
  id: string;
  label: string;
  description?: string;
  href: string;
}

export interface HistorianEvent {
  id: string;
  source: string;
  kind: string;
  title: string;
  timestamp: string;
}

export interface IngestConversion {
  id: string;
  slug: string;
  files: number;
  storage: boolean;
  createdAt: string;
}

export interface KnowledgeIndex {
  id: string;
  slug: string;
  title: string;
  createdAt: string;
}

export interface DashboardData {
  quickActions: QuickAction[];
  historian: HistorianEvent[];
  ingest: IngestConversion[];
  corpus: {
    conversations: number;
    messages: number;
    lastUpdated?: string;
  };
  knowledge: KnowledgeIndex[];
}
