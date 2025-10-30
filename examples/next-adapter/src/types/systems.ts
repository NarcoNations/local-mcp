import { KnowledgeEntry } from './dashboard';

export interface TimelineEvent {
  id: string;
  source: string;
  kind: string;
  ts: string;
  severity?: 'info' | 'warn' | 'error';
  summary: string;
  actor: string;
  tags: string[];
  location?: string;
}

export interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  score: number;
  source: string;
  slug?: string;
}

export interface KnowledgeRecord extends KnowledgeEntry {
  description?: string;
  status: 'ready' | 'pending' | 'error';
}

export interface ApiProbeResult {
  id: string;
  type: 'alpha' | 'llm';
  request: Record<string, unknown>;
  response: string;
  createdAt: string;
}


export interface WorkroomSticky {
  id: string;
  laneId: string;
  text: string;
  color: 'cyan' | 'gold' | 'rose';
}

export interface WorkroomLane {
  id: string;
  title: string;
  stickies: WorkroomSticky[];
}

export interface PromptDefinition {
  id: string;
  name: string;
  description: string;
  body: string;
}

export interface ResearchResult {
  query: string;
  facts: string[];
  insights: string[];
  sources: Array<{ title: string; url: string }>;
}

export interface MvpResult {
  id: string;
  title: string;
  summary: string;
  features: string[];
}
