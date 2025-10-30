import type { DashboardData } from "@/types/dashboard";

export const dashboardMock: DashboardData = {
  quickActions: [
    {
      id: "upload",
      label: "Upload file",
      description: "Convert documents into structured knowledge",
      href: "/ingest",
    },
    {
      id: "chat-export",
      label: "Paste chat export URL",
      description: "Stream ChatGPT exports into the corpus",
      href: "/corpus",
    },
    {
      id: "index-knowledge",
      label: "Index Knowledge",
      description: "Deploy enriched knowledge into search",
      href: "/knowledge",
    },
    {
      id: "new-brief",
      label: "New MVP Brief",
      description: "Author a minimum vibe product brief",
      href: "/mvp",
    },
  ],
  historian: Array.from({ length: 10 }).map((_, index) => ({
    id: `evt-${index}`,
    source: index % 2 === 0 ? "ingest" : "research",
    kind: index % 3 === 0 ? "ingest.convert" : "research.fact",
    title: index % 3 === 0 ? `Converted drop #${index}` : `Insight ${index}`,
    timestamp: new Date(Date.now() - index * 1000 * 60 * 12).toISOString(),
  })),
  ingest: Array.from({ length: 5 }).map((_, index) => ({
    id: `ingest-${index}`,
    slug: `drop-${index + 1}`,
    files: Math.floor(Math.random() * 8) + 2,
    storage: index % 2 === 0,
    createdAt: new Date(Date.now() - index * 1000 * 60 * 45).toISOString(),
  })),
  corpus: {
    conversations: 128,
    messages: 5210,
    lastUpdated: new Date().toISOString(),
  },
  knowledge: Array.from({ length: 4 }).map((_, index) => ({
    id: `knowledge-${index}`,
    slug: `playbook-${index + 1}`,
    title: `Knowledge drop ${index + 1}`,
    createdAt: new Date(Date.now() - index * 1000 * 60 * 60 * 6).toISOString(),
  })),
};
