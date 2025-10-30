export interface QuickAction {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: 'upload' | 'link' | 'index' | 'spark';
}

export interface HistorianEvent {
  id: string;
  source: string;
  kind: string;
  title: string;
  timestamp: string;
  meta?: {
    badge?: 'success' | 'warn' | 'error' | 'info';
    note?: string;
  };
}

export interface IngestConversion {
  id: string;
  slug: string;
  files: number;
  storage: boolean;
  updatedAt: string;
}

export interface KnowledgeItem {
  slug: string;
  title: string;
  files: number;
  indexedAt: string;
}

export interface CorpusStats {
  conversations: number;
  messages: number;
}

export interface DashboardData {
  quickActions: QuickAction[];
  historian: HistorianEvent[];
  conversions: IngestConversion[];
  corpus: CorpusStats;
  knowledge: KnowledgeItem[];
}

export const dashboardMock: DashboardData = {
  quickActions: [
    {
      id: 'upload-file',
      title: 'Upload file',
      description: 'Convert datasets, decks, and PDFs into signals.',
      href: '/ingest',
      icon: 'upload',
    },
    {
      id: 'paste-chat',
      title: 'Paste chat export URL',
      description: 'Harvest chat histories straight into the corpus.',
      href: '/corpus',
      icon: 'link',
    },
    {
      id: 'index-knowledge',
      title: 'Index knowledge',
      description: 'Queue the latest doc drops for semantic search.',
      href: '/knowledge',
      icon: 'index',
    },
    {
      id: 'new-mvp',
      title: 'New MVP brief',
      description: 'Spin an MVP brief from your freshest signals.',
      href: '/mvp',
      icon: 'spark',
    },
  ],
  historian: [
    {
      id: 'evt-01',
      source: 'ingest',
      kind: 'ingest.convert',
      title: 'Converted VentureDeck.pdf → 14 assets',
      timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
      meta: { badge: 'success', note: 'storage synced' },
    },
    {
      id: 'evt-02',
      source: 'knowledge',
      kind: 'knowledge.index',
      title: 'Indexed founder-insights-2024',
      timestamp: new Date(Date.now() - 1000 * 60 * 24).toISOString(),
      meta: { badge: 'info' },
    },
    {
      id: 'evt-03',
      source: 'search',
      kind: 'search.query',
      title: 'Query “Narco nations go-to-market”',
      timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      meta: { badge: 'info' },
    },
    {
      id: 'evt-04',
      source: 'api',
      kind: 'api.alpha-probe',
      title: 'Alpha feed pinged: ticker NARC → fn sentiment_delta',
      timestamp: new Date(Date.now() - 1000 * 60 * 58).toISOString(),
      meta: { badge: 'warn', note: 'latency spike 320ms' },
    },
    {
      id: 'evt-05',
      source: 'workroom',
      kind: 'workroom.export',
      title: 'Workroom board exported to JSON',
      timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      meta: { badge: 'success' },
    },
    {
      id: 'evt-06',
      source: 'ingest',
      kind: 'ingest.chatgpt',
      title: 'Chat export “gtm-war-room” hydrated',
      timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      meta: { badge: 'success' },
    },
    {
      id: 'evt-07',
      source: 'corpus',
      kind: 'corpus.merge',
      title: 'Merged 22 new conversations',
      timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      meta: { badge: 'info' },
    },
    {
      id: 'evt-08',
      source: 'knowledge',
      kind: 'knowledge.refresh',
      title: 'Refreshed narco-lore-playbook',
      timestamp: new Date(Date.now() - 1000 * 60 * 220).toISOString(),
    },
    {
      id: 'evt-09',
      source: 'api',
      kind: 'api.llm-probe',
      title: 'LLM probe “counterintel summary” completed',
      timestamp: new Date(Date.now() - 1000 * 60 * 260).toISOString(),
      meta: { badge: 'success' },
    },
    {
      id: 'evt-10',
      source: 'search',
      kind: 'search.snapshot',
      title: 'Snapshot pinned: “social sentiment delta”',
      timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
      meta: { badge: 'info' },
    },
  ],
  conversions: [
    {
      id: 'conv-01',
      slug: 'venturedeck',
      files: 14,
      storage: true,
      updatedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    },
    {
      id: 'conv-02',
      slug: 'narco-field-notes',
      files: 9,
      storage: false,
      updatedAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    },
    {
      id: 'conv-03',
      slug: 'intel-drop-aug',
      files: 17,
      storage: true,
      updatedAt: new Date(Date.now() - 1000 * 60 * 70).toISOString(),
    },
    {
      id: 'conv-04',
      slug: 'activations-2024',
      files: 6,
      storage: true,
      updatedAt: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
    },
    {
      id: 'conv-05',
      slug: 'contraband-ops',
      files: 22,
      storage: false,
      updatedAt: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
    },
  ],
  corpus: {
    conversations: 482,
    messages: 13240,
  },
  knowledge: [
    {
      slug: 'founder-insights-2024',
      title: 'Founder Insights 2024',
      files: 12,
      indexedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
      slug: 'narco-lore-playbook',
      title: 'Narco Lore Playbook',
      files: 7,
      indexedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    },
    {
      slug: 'borderless-supply-lines',
      title: 'Borderless Supply Lines',
      files: 9,
      indexedAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    },
  ],
};
