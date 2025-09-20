import chokidar from "chokidar";
import type { FSWatcher } from "chokidar";
import path from "path";
import { z } from "zod";
import { Store, reindexPaths } from "../store/store.js";
import { FSGuard } from "../utils/fs-guard.js";
import { info } from "../utils/logger.js";

const InputSchema = z.object({
  paths: z.array(z.string().min(1)).default([])
});

type EventEmitter = (event: Record<string, unknown>) => void;

export function createWatchTool(store: Store, emit: EventEmitter) {
  const watchers: FSWatcher[] = [];
  return {
    name: "watch",
    description: "Watch directories for changes and automatically reindex.",
    inputSchema: InputSchema,
    jsonSchema: {
      type: "object",
      properties: {
        paths: { type: "array", items: { type: "string" }, default: [] }
      },
      additionalProperties: false
    },
    handler: async (raw: unknown) => {
      const input = InputSchema.parse(raw ?? {});
      const guard = await FSGuard.create(store.getConfig().roots);
      const targets = input.paths.length ? input.paths : store.getConfig().roots.roots;
      const watcher = chokidar.watch(targets, {
        ignoreInitial: true,
        awaitWriteFinish: { stabilityThreshold: 250, pollInterval: 100 },
        persistent: true
      });
      watchers.push(watcher);
      const debounce = new Map<string, NodeJS.Timeout>();

      const schedule = (file: string) => {
        const abs = path.resolve(file);
        clearTimeout(debounce.get(abs));
        const timer = setTimeout(async () => {
          try {
            const resolved = await guard.resolvePath(abs);
            const relative = path.relative(process.cwd(), resolved);
            await reindexPaths(store, [relative]);
            emit({ event: "watch", action: "update", path: relative });
          } catch (error) {
            info("watch-reindex-error", { path: file, error: (error as Error).message });
          }
        }, 250);
        debounce.set(abs, timer);
      };

      watcher.on("add", (file) => {
        schedule(file);
        emit({ event: "watch", action: "add", path: path.relative(process.cwd(), path.resolve(file)) });
      });
      watcher.on("change", (file) => {
        schedule(file);
        emit({ event: "watch", action: "change", path: path.relative(process.cwd(), path.resolve(file)) });
      });
      watcher.on("unlink", async (file) => {
        const abs = path.resolve(file);
        const relative = path.relative(process.cwd(), abs);
        await store.removeFile(relative);
        emit({ event: "watch", action: "unlink", path: relative });
      });

      return {
        watching: targets
      };
    }
  };
}
