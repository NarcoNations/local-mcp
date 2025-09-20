import { z } from "zod";
import { Store } from "../store/store.js";

const FiltersSchema = z.object({
  type: z.array(z.enum(["pdf", "markdown", "text", "word", "pages"]))
}).partial();

const InputSchema = z.object({
  query: z.string().min(1),
  k: z.number().min(1).max(50).default(8),
  alpha: z.number().min(0).max(1).default(0.65),
  filters: FiltersSchema.optional()
});

export type SearchLocalInput = z.infer<typeof InputSchema>;

export function createSearchLocalTool(store: Store) {
  return {
    name: "search_local",
    description: "Hybrid search across the local research corpus.",
    inputSchema: InputSchema,
    jsonSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        k: { type: "integer", minimum: 1, maximum: 50, default: 8 },
        alpha: { type: "number", minimum: 0, maximum: 1, default: 0.65 },
        filters: {
          type: "object",
          properties: {
            type: {
              type: "array",
              items: { enum: ["pdf", "markdown", "text", "word", "pages"] }
            }
          },
          additionalProperties: false
        }
      },
      required: ["query"],
      additionalProperties: false
    },
    handler: async (raw: unknown) => {
      const input = InputSchema.parse(raw);
      const results = await store.hybridSearch({
        query: input.query,
        k: input.k,
        alpha: input.alpha,
        filters: input.filters
      });
      return {
        query: input.query,
        results
      };
    }
  };
}
