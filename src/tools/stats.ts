import type { KnowledgeStore } from "../store/store.js";

export async function stats(store: KnowledgeStore, _input?: unknown, _context?: { emit: (event: unknown) => void }) {
  const data = store.stats();
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(data, null, 2),
      },
    ],
    structuredContent: data,
  };
}

export const statsSpec = {
  name: "stats",
  description: "Return aggregate stats for the indexed corpus.",
  inputSchema: undefined,
  handler: stats,
};
