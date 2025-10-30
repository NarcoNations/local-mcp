import { CorpusStats, DashboardData, HistorianEvent, IngestConversion, KnowledgeEntry } from '../types/dashboard';

export const mockHistorianEvents: HistorianEvent[] = [
  {
    id: 'evt-1001',
    source: 'ingest:github',
    kind: 'ingest.completed',
    ts: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    summary: 'Converted 4 files from /labs/vision drop.',
    severity: 'info',
  },
  {
    id: 'evt-1000',
    source: 'workroom',
    kind: 'brief.updated',
    ts: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    summary: 'Brief “Astra mission” received 6 new annotations.',
    severity: 'info',
  },
  {
    id: 'evt-0999',
    source: 'corpus:chatgpt',
    kind: 'corpus.indexed',
    ts: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    summary: 'Imported 2.1k turns from tactical thread.',
    severity: 'info',
  },
  {
    id: 'evt-0998',
    source: 'search',
    kind: 'query',
    ts: new Date(Date.now() - 1000 * 60 * 27).toISOString(),
    summary: 'Search probe: “Cypher cell supply lines”.',
    severity: 'info',
  },
  {
    id: 'evt-0997',
    source: 'knowledge',
    kind: 'knowledge.indexed',
    ts: new Date(Date.now() - 1000 * 60 * 32).toISOString(),
    summary: 'Indexed “narconations/opsec-field-manual”.',
    severity: 'info',
  },
  {
    id: 'evt-0996',
    source: 'ingest:drive',
    kind: 'ingest.failed',
    ts: new Date(Date.now() - 1000 * 60 * 44).toISOString(),
    summary: 'Archive missing. Cold storage offline.',
    severity: 'warn',
  },
  {
    id: 'evt-0995',
    source: 'api-manager',
    kind: 'probe.sent',
    ts: new Date(Date.now() - 1000 * 60 * 52).toISOString(),
    summary: 'Alpha probe -> operator-signal.analyze()',
    severity: 'info',
  },
  {
    id: 'evt-0994',
    source: 'social',
    kind: 'post.generated',
    ts: new Date(Date.now() - 1000 * 60 * 68).toISOString(),
    summary: 'Generated 3 micro-narratives for drop 17.',
    severity: 'info',
  },
  {
    id: 'evt-0993',
    source: 'map',
    kind: 'map.rendered',
    ts: new Date(Date.now() - 1000 * 60 * 92).toISOString(),
    summary: 'Rendered supply nodes heatmap for Sector Delta.',
    severity: 'info',
  },
  {
    id: 'evt-0992',
    source: 'corpus:slack',
    kind: 'corpus.indexed',
    ts: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    summary: 'Synced 12 messages from Ops comms.',
    severity: 'info',
  },
];

export const mockIngestConversions: IngestConversion[] = [
  {
    id: 'ing-4001',
    slug: 'labs/vision-drop',
    files: 4,
    storage: 'hot',
    status: 'completed',
    updatedAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
  },
  {
    id: 'ing-4000',
    slug: 'ops/hub-survey',
    files: 12,
    storage: 'cold',
    status: 'processing',
    updatedAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
  },
  {
    id: 'ing-3999',
    slug: 'narratives/batch-17',
    files: 8,
    storage: 'hot',
    status: 'completed',
    updatedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  },
  {
    id: 'ing-3998',
    slug: 'field/audio-drops',
    files: 3,
    storage: 'cold',
    status: 'failed',
    updatedAt: new Date(Date.now() - 1000 * 60 * 44).toISOString(),
  },
  {
    id: 'ing-3997',
    slug: 'archives/ops-journal',
    files: 5,
    storage: 'hot',
    status: 'completed',
    updatedAt: new Date(Date.now() - 1000 * 60 * 88).toISOString(),
  },
];

export const mockCorpusStats: CorpusStats = {
  conversations: 274,
  messages: 61289,
  lastIndexedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
};

export const mockKnowledgeEntries: KnowledgeEntry[] = [
  {
    id: 'kn-3004',
    slug: 'narconations/opsec-field-manual',
    files: 7,
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    id: 'kn-3003',
    slug: 'labs/vision-recon-blueprint',
    files: 5,
    createdAt: new Date(Date.now() - 1000 * 60 * 85).toISOString(),
  },
  {
    id: 'kn-3002',
    slug: 'social/propagation-kit',
    files: 9,
    createdAt: new Date(Date.now() - 1000 * 60 * 190).toISOString(),
  },
];

export const mockDashboardRecentSearches: DashboardData['searchRecent'] = [
  { id: 'qry-1', query: 'exfil routes near akira', ts: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
  { id: 'qry-2', query: 'ops breather rituals', ts: new Date(Date.now() - 1000 * 60 * 22).toISOString() },
  { id: 'qry-3', query: 'supply chain risk', ts: new Date(Date.now() - 1000 * 60 * 40).toISOString() },
];

export const mockDashboardData: DashboardData = {
  historian: mockHistorianEvents,
  ingest: mockIngestConversions,
  corpus: mockCorpusStats,
  knowledge: mockKnowledgeEntries,
  searchRecent: mockDashboardRecentSearches,
};
