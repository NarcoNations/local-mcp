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

interface WatchToolOptions {
  emit?: WatchEmitter;
  onStart?: (sessionId: string | undefined, paths: string[]) => void;
  onStop?: (sessionId: string | undefined) => void;
}

export function createWatchTool(config: AppConfig, options?: WatchToolOptions) {
  let watcher: FSWatcher | null = null;
  let activeSession: string | undefined;

  return async function watch(input: unknown, extra?: Record<string, unknown>) {
    const parsed = WatchInputSchema.parse(input ?? {});
    const targets = parsed.paths.length ? parsed.paths : config.roots.roots;
    const resolvedTargets = await Promise.all(targets.map((t) => ensureWithinRoots(config.roots.roots, t)));

    const sessionId = typeof extra?.sessionId === "string" ? extra.sessionId : undefined;

    if (activeSession) {
      options?.onStop?.(activeSession);
    }
    activeSession = sessionId;

    if (watcher) {
      watcher.removeAllListeners();
      await watcher.close().catch(() => {});
      watcher = null;
    }

    const store = await getStore(config);
    watcher = chokidar.watch(resolvedTargets, { ignoreInitial: true, awaitWriteFinish: { stabilityThreshold: 200 } });

    options?.onStart?.(sessionId, resolvedTargets);

    watcher.on("all", async (event: string, filePath: string) => {
      if (!["add", "change", "unlink"].includes(event)) return;
      try {
        const abs = await ensureWithinRoots(config.roots.roots, filePath);
        logger.info("watch-event", { event, path: abs, sessionId: sessionId ?? "unknown" });
        if (event === "unlink") {
          await store.reindex([path.dirname(abs)]);
        } else {
          await store.reindex([abs]);
        }
        options?.emit?.({ event: "watch", path: abs, action: event }, extra);
      } catch (err) {
        logger.warn("watch-skip", { filePath, err: String(err) });
      }
    });

    watcher.on("error", (error) => {
      const message = error instanceof Error ? error.message : String(error);
      logger.error("watch-error", { error: message, sessionId: sessionId ?? "unknown" });
      options?.emit?.({ event: "watch-error", error: message }, extra);
    });

    watcher.on(
      "close",
      (() => {
        if (activeSession === sessionId) {
          options?.onStop?.(sessionId);
          activeSession = undefined;
        }
      }) as never
    );

    return { watching: resolvedTargets };
  };
}
