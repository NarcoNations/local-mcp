import chokidar, { FSWatcher } from "chokidar";
import path from "path";
import { z } from "zod";
import { AppContext } from "../app.js";
import { reindex } from "./reindex.js";
import { logger } from "../utils/logger.js";

const InputSchema = z.object({
  paths: z.array(z.string()).optional(),
});

type EmitFn = (event: { event: string; path: string; action: string }) => void;

const activeWatchers: Set<FSWatcher> = new Set();

export async function watch(context: AppContext, input: unknown, emit?: EmitFn) {
  const { config } = context;
  const { paths } = InputSchema.parse(input ?? {});
  const watchRoots = paths && paths.length ? paths : config.roots.roots;
  const ignores = config.roots.exclude;

  const pending = new Map<string, NodeJS.Timeout>();
  const schedule = (filePath: string) => {
    const existing = pending.get(filePath);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(async () => {
      pending.delete(filePath);
      try {
        await reindex(context, { paths: [filePath] });
      } catch (err: any) {
        logger.warn("watch-reindex-failed", { error: err.message, path: filePath });
      }
    }, 250);
    pending.set(filePath, timer);
  };

  const watcher = chokidar.watch(watchRoots, {
    ignored: ignores,
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 200 },
  });

  watcher.on("all", (action, filePath) => {
    const relative = path.relative(process.cwd(), filePath);
    if (action === "add" || action === "change") {
      schedule(filePath);
    }
    if (action === "unlink") {
      schedule(filePath);
    }
    const event = { event: "watch", path: relative, action };
    if (emit) emit(event);
    logger.info("watch-event", event);
  });

  watcher.on("error", (error) => {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("watch-error", { error: err.message });
  });

  activeWatchers.add(watcher);

  return {
    watching: watchRoots,
  };
}

export async function closeWatchers(): Promise<void> {
  await Promise.all(Array.from(activeWatchers).map((watcher) => watcher.close()));
  activeWatchers.clear();
}
