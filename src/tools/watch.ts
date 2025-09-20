import chokidar, { type FSWatcher } from "chokidar";
import path from "path";
import { z } from "zod";
import { AppConfig } from "../config.js";
import { ensureWithinRoots } from "../utils/fs-guard.js";
import { getStore } from "../store/store.js";
import { logger } from "../utils/logger.js";

export const WatchShape = {
  paths: z.array(z.string()).default([]),
};

export const WatchInputSchema = z.object(WatchShape);

type WatchEmitter = (event: Record<string, unknown>, extra?: Record<string, unknown>) => void;

export type WatchHandler = {
  (input: unknown, extra?: Record<string, unknown>): Promise<{ watching: string[] }>;
  stop: () => Promise<void>;
};

export function createWatchTool(config: AppConfig, emit?: WatchEmitter): WatchHandler {
  let watcher: FSWatcher | null = null;
  const handler = async function watch(input: unknown, extra?: Record<string, unknown>) {
    const parsed = WatchInputSchema.parse(input ?? {});
    const targets = parsed.paths.length ? parsed.paths : config.roots.roots;
    const resolvedTargets = await Promise.all(targets.map((t) => ensureWithinRoots(config.roots.roots, t)));
    watcher?.close().catch(() => {});
    watcher = chokidar.watch(resolvedTargets, { ignoreInitial: true, awaitWriteFinish: { stabilityThreshold: 200 } });
    const store = await getStore(config);
    watcher.on("all", async (event: string, filePath: string) => {
      if (!["add", "change", "unlink"].includes(event)) return;
      try {
        const abs = await ensureWithinRoots(config.roots.roots, filePath);
        logger.info("watch-event", { event, path: abs });
        if (event === "unlink") {
          await store.reindex([path.dirname(abs)]);
        } else {
          await store.reindex([abs]);
        }
        emit?.({ event: "watch", path: abs, action: event }, extra);
      } catch (err) {
        logger.warn("watch-skip", { filePath, err: String(err) });
      }
    });
    return { watching: resolvedTargets };
  };

  handler.stop = async () => {
    try {
      await watcher?.close();
    } catch (err) {
      logger.debug("watch-stop-error", { err: String(err) });
    } finally {
      watcher = null;
    }
  };

  return handler;
}
