import { z } from "zod";
import type { KnowledgeStore } from "../store/store.js";

const InputSchema = z.object({
  query: z.string().min(1),
  k: z.number().min(1).max(32).default(8),
  alpha: z.number().min(0).max(1).default(0.65),
  filters: z
    .object({
      type: z.array(z.enum(["pdf", "markdown", "text", "word", "pages"])).optional(),
      tags: z.array(z.string()).optional(),
    })
    .optional(),
});

export type SearchLocalInput = z.infer<typeof InputSchema>;

export async function searchLocal(store: KnowledgeStore, input: unknown, _context?: { emit: (event: unknown) => void }) {
  const parsed = InputSchema.parse(input);
  const response = await store.search({
    query: parsed.query,
    k: parsed.k,
    alpha: parsed.alpha,
    filters: parsed.filters,
  });
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(response, null, 2),
      },
    ],
    structuredContent: response,
  };
}

export const searchLocalSpec = {
  name: "search_local",
  description: "Hybrid dense + keyword search across the local NarcoNations corpus.",
  inputSchema: InputSchema,
  handler: searchLocal,
};
