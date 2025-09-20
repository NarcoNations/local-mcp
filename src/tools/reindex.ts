import type { z } from "zod";
import { ReindexInput } from "../store/schema.js";
import { reindexPaths } from "../store/store.js";

type ReindexArgs = z.infer<typeof ReindexInput>;

export async function reindexTool(input: unknown) {
  const parsed: ReindexArgs = ReindexInput.parse(input ?? {});
  return reindexPaths(parsed.paths);
}
