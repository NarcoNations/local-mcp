import type { z } from "zod";
import { SearchLocalInput } from "../store/schema.js";
import { searchHybrid } from "../store/store.js";

type SearchArgs = z.infer<typeof SearchLocalInput>;

export async function searchLocal(input: unknown) {
  const parsed: SearchArgs = SearchLocalInput.parse(input);
  const results = await searchHybrid({
    query: parsed.query,
    k: parsed.k ?? 8,
    alpha: parsed.alpha ?? 0.65,
    filters: parsed.filters,
  });
  return { query: parsed.query, results };
}
