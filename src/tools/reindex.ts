import { z } from "zod";
import { ResearchStore } from "../store/store.js";

const InputSchema = z.object({
  paths: z.array(z.string().min(1)).optional(),
});

export async function handleReindex(store: ResearchStore, input: unknown) {
  const parsed = input ? InputSchema.parse(input) : { paths: undefined };
  const summary = await store.reindex(parsed.paths);
  return summary;
}

export const reindexSpec = {
  name: "reindex",
  description: "Rebuild the index for one or more paths.",
  inputSchema: InputSchema,
};
