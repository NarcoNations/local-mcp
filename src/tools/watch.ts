import { z } from "zod";
import { ResearchStore } from "../store/store.js";

const InputSchema = z.object({
  paths: z.array(z.string().min(1)).optional(),
});

export type WatchEmitter = (event: { event: string; path: string }) => void;

export async function handleWatch(store: ResearchStore, input: unknown, emit: WatchEmitter) {
  const parsed = input ? InputSchema.parse(input) : { paths: undefined };
  const close = await store.watch(parsed.paths ?? [], emit);
  return {
    result: { watching: parsed.paths ?? store.getRoots() },
    close,
  };
}

export const watchSpec = {
  name: "watch",
  description: "Watch paths for changes and automatically reindex.",
  inputSchema: InputSchema,
};
