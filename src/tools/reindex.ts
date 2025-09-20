import { z } from "zod";
import type { KnowledgeStore } from "../store/store.js";

const InputSchema = z.object({
  paths: z.array(z.string().min(1)).optional(),
});

export async function reindex(store: KnowledgeStore, input: unknown, _context?: { emit: (event: unknown) => void }) {
  const parsed = InputSchema.parse(input ?? {});
  const result = await store.indexPaths(parsed.paths ?? []);
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(result, null, 2),
      },
    ],
    structuredContent: result,
  };
}

export const reindexSpec = {
  name: "reindex",
  description: "Reindex one or more paths (defaults to configured roots).",
  inputSchema: InputSchema,
  handler: reindex,
};
