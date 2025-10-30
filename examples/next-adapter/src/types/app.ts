export interface HistorianEvent {
  id: string;
  source: string;
  kind: string;
  title: string;
  occurredAt: string;
  metadata?: Record<string, unknown>;
}

export interface IngestConversion {
  id: string;
  slug: string;
  files: number;
  stored: boolean;
  status: "queued" | "processing" | "complete" | "error";
  updatedAt: string;
}

export interface CorpusStats {
  conversations: number;
  messages: number;
  sources?: number;
}

export interface KnowledgeEntry {
  id: string;
  slug: string;
  createdAt: string;
  files: number;
  status: "idle" | "indexing" | "ready";
}

export interface SearchResultItem {
  id: string;
  title: string;
  snippet: string;
  score: number;
  source: string;
}

export interface TimelineEvent {
  id: string;
  source: string;
  kind: string;
  occurredAt: string;
  payload: string;
  metadata?: Record<string, unknown>;
}

export interface PromptTemplate {
  id: string;
  title: string;
  summary: string;
  body: string;
  tags: string[];
}

export interface ResearchResponse {
  query: string;
  facts: string[];
  insights: string[];
  sources: { title: string; url: string }[];
}

export interface WorkroomSticky {
  id: string;
  lane: string;
  content: string;
  tone?: string;
}

export interface SocialTemplate {
  id: string;
  name: string;
  description: string;
}
