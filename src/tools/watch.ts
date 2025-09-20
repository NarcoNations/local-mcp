import chokidar from "chokidar";
import { z } from "zod";
import type { KnowledgeStore } from "../store/store.js";
import type { AppConfig } from "../types.js";

const InputSchema = z.object({
  paths: z.array(z.string().min(1)).optional(),
});

type WatchContext = {
  emit: (event: unknown) => void;
  config: AppConfig;
};

export async function watch(store: KnowledgeStore, input: unknown, context?: WatchContext) {
  if (!context?.emit || !context?.config) {
    throw new Error("Watch tool requires streaming context with emit + config");
  }
  const parsed = InputSchema.parse(input ?? {});
  const watchTargets = parsed.paths?.length ? parsed.paths : context.config.roots.roots;
  const watcher = chokidar.watch(watchTargets, { ignoreInitial: true });

  const handleChange = async (action: "add" | "change", file: string) => {
    try {
      await store.indexPaths([file]);
      context.emit({ event: "watch", action, path: file });
    } catch (err) {
      context.emit({ event: "watch", action: "error", path: file, error: String(err) });
    }
  };

  watcher
    .on("add", (file) => void handleChange("add", file))
    .on("change", (file) => void handleChange("change", file))
    .on("unlink", async (file) => {
      await store.removePath(file);
      context.emit({ event: "watch", action: "unlink", path: file });
    });

  context.emit({ event: "watch", action: "ready", paths: watchTargets });
  const payload = { watching: watchTargets };
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(payload, null, 2),
      },
    ],
    structuredContent: payload,
  };
}

export const watchSpec = {
  name: "watch",
  description: "Start a filesystem watcher that keeps the index fresh.",
  inputSchema: InputSchema,
  handler: watch,
};
