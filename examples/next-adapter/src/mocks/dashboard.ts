import type {
  CorpusStats,
  HistorianEvent,
  IngestConversion,
  KnowledgeEntry,
  SearchResultItem,
  TimelineEvent,
  PromptTemplate,
  ResearchResponse,
  WorkroomSticky,
  SocialTemplate,
} from "../types/app";

export const mockHistorianEvents: HistorianEvent[] = [
  {
    id: "evt-001",
    source: "ingest",
    kind: "conversion",
    title: "Uploaded narco-trade-intel.pdf",
    occurredAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    metadata: { files: 12 },
  },
  {
    id: "evt-002",
    source: "knowledge",
    kind: "index",
    title: "Indexed 2024 cartel ops digest",
    occurredAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
  },
  {
    id: "evt-003",
    source: "search",
    kind: "query",
    title: "Search — supply chain vulnerabilities",
    occurredAt: new Date(Date.now() - 1000 * 60 * 32).toISOString(),
  },
  {
    id: "evt-004",
    source: "api",
    kind: "probe",
    title: "LLM probe executed (threat detection)",
    occurredAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
  },
  {
    id: "evt-005",
    source: "workroom",
    kind: "sticky",
    title: "New MVP brainstorm lane created",
    occurredAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
  {
    id: "evt-006",
    source: "mvp",
    kind: "generation",
    title: "Generated MVP brief — Operation Silverline",
    occurredAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: "evt-007",
    source: "research",
    kind: "report",
    title: "Research deck compiled for synthetic routes",
    occurredAt: new Date(Date.now() - 1000 * 60 * 160).toISOString(),
  },
  {
    id: "evt-008",
    source: "map",
    kind: "layer",
    title: "Map layer published — border heat",
    occurredAt: new Date(Date.now() - 1000 * 60 * 210).toISOString(),
  },
  {
    id: "evt-009",
    source: "social",
    kind: "campaign",
    title: "Queued social signal drop",
    occurredAt: new Date(Date.now() - 1000 * 60 * 260).toISOString(),
  },
  {
    id: "evt-010",
    source: "ingest",
    kind: "conversion",
    title: "Imported aerial recon imagery",
    occurredAt: new Date(Date.now() - 1000 * 60 * 320).toISOString(),
  },
];

export const mockIngestConversions: IngestConversion[] = [
  {
    id: "ing-001",
    slug: "narco-observatory-q3",
    files: 8,
    stored: true,
    status: "complete",
    updatedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  },
  {
    id: "ing-002",
    slug: "field-notes-23",
    files: 3,
    stored: true,
    status: "processing",
    updatedAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
  },
  {
    id: "ing-003",
    slug: "chat-export-latam",
    files: 1,
    stored: false,
    status: "queued",
    updatedAt: new Date(Date.now() - 1000 * 60 * 70).toISOString(),
  },
  {
    id: "ing-004",
    slug: "intel-rundown-brief",
    files: 5,
    stored: true,
    status: "complete",
    updatedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: "ing-005",
    slug: "historian-tape-logs",
    files: 9,
    stored: false,
    status: "error",
    updatedAt: new Date(Date.now() - 1000 * 60 * 200).toISOString(),
  },
];

export const mockCorpusStats: CorpusStats = {
  conversations: 128,
  messages: 3942,
  sources: 42,
};

export const mockKnowledgeEntries: KnowledgeEntry[] = [
  {
    id: "kn-001",
    slug: "ops/black-slate",
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    files: 14,
    status: "ready",
  },
  {
    id: "kn-002",
    slug: "intel/river-gate",
    createdAt: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
    files: 6,
    status: "indexing",
  },
  {
    id: "kn-003",
    slug: "archive/pipeline-summaries",
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    files: 22,
    status: "idle",
  },
  {
    id: "kn-004",
    slug: "ops/emerald-spear",
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    files: 11,
    status: "ready",
  },
  {
    id: "kn-005",
    slug: "intel/pacifica-trails",
    createdAt: new Date(Date.now() - 1000 * 60 * 260).toISOString(),
    files: 7,
    status: "indexing",
  },
  {
    id: "kn-006",
    slug: "archive/legacy-ledger",
    createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    files: 18,
    status: "idle",
  },
];

export const mockSearchResults: SearchResultItem[] = [
  {
    id: "sr-001",
    title: "Pipeline corridor disruptions",
    snippet: "Consolidated incidents impacting northern trade routes for Q3.",
    score: 0.92,
    source: "knowledge:ops/black-slate",
  },
  {
    id: "sr-002",
    title: "Conversation — logistics recalibration",
    snippet: "Discussed rerouting shipments via covert maritime lanes.",
    score: 0.88,
    source: "corpus:conversations/latam/08-12",
  },
];

export const mockTimeline: TimelineEvent[] = mockHistorianEvents.map((event, index) => ({
  ...event,
  payload: `Event payload ${index + 1}`,
}));

export const mockPrompts: PromptTemplate[] = [
  {
    id: "prompt-001",
    title: "War-room recap",
    summary: "Summarize strategist channel updates with actionable outcomes.",
    body: "You are the summarizer of cartel strategist channels...",
    tags: ["summary", "strategic"],
  },
  {
    id: "prompt-002",
    title: "Threat matrix",
    summary: "Generate a threat matrix for new campaign briefs.",
    body: "Evaluate threats by impact and likelihood...",
    tags: ["threat", "analysis"],
  },
];

export const mockResearch: ResearchResponse = {
  query: "Synthetic routes",
  facts: [
    "Major labs shifted to modular production cells in 2024.",
    "Interdictions increased 18% along maritime corridors.",
  ],
  insights: [
    "Diversify entry points to reduce detection clustering.",
    "Invest in on-demand logistics to counter rapid crackdowns.",
  ],
  sources: [
    { title: "UNODC Trendwatch", url: "https://example.com/unodc" },
    { title: "Local enforcement dispatch", url: "https://example.com/dispatch" },
  ],
};

export const mockStickies: WorkroomSticky[] = [
  { id: "sticky-001", lane: "Discover", content: "Field intel sync w/ Helios." },
  { id: "sticky-002", lane: "Define", content: "Frame MVP scope around desert corridors." },
  { id: "sticky-003", lane: "Deliver", content: "Prototype logistic tracker by Friday." },
];

export const mockSocialTemplates: SocialTemplate[] = [
  { id: "tpl-short", name: "Neon Flash Update", description: "Short pulse update for operations team." },
  { id: "tpl-brief", name: "Mission Brief", description: "Long form narrative for leadership." },
  { id: "tpl-signal", name: "Signal Drop", description: "Encrypted drop for allies." },
];
