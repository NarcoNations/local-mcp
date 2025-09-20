import { z } from "zod";
import { ResearchStore } from "../store/store.js";

const FiltersSchema = z
  .object({
    type: z.array(z.enum(["pdf", "markdown", "text", "word", "pages"])).optional(),
  })
  .optional();

const InputSchema = z.object({
  query: z.string().min(1),
  k: z.number().int().min(1).max(32).default(8),
  alpha: z.number().min(0).max(1).default(0.65),
  filters: FiltersSchema,
});

export type SearchLocalInput = z.infer<typeof InputSchema>;

export async function handleSearchLocal(store: ResearchStore, input: unknown) {
  const parsed = InputSchema.parse(input);
  const results = await store.search(parsed.query, {
    k: parsed.k,
    alpha: parsed.alpha,
    filters: parsed.filters,
  });
  return {
    query: parsed.query,
    results,
  };
}

export const searchLocalSpec = {
  name: "search_local",
  description: "Hybrid search across indexed local documents.",
  inputSchema: InputSchema,
};
