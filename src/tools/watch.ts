import chokidar from "chokidar";
import path from "path";
import { WatchInput } from "../store/schema.js";
import { reindexPaths } from "../store/store.js";
import { loadConfig } from "../config.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("watch");

export type WatchEvent = {
  event: "add" | "change" | "unlink";
  path: string;
};

export async function createWatcher(input: unknown, onEvent?: (event: WatchEvent) => void) {
  const parsed = WatchInput.parse(input ?? {});
  const config = await loadConfig();
  const targets = parsed.paths && parsed.paths.length ? parsed.paths : config.roots.roots;
  const watcher = chokidar.watch(targets, {
    ignored: config.roots.exclude,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 250,
      pollInterval: 100,
    },
  });

  watcher.on("all", async (eventName, filePath) => {
    if (!filePath) return;
    if (!config.roots.include.includes(path.extname(filePath).toLowerCase())) return;
    const evt: WatchEvent = {
      event: eventName === "add" ? "add" : eventName === "unlink" ? "unlink" : "change",
      path: filePath,
    };
    onEvent?.(evt);
    try {
      await reindexPaths([filePath]);
    } catch (err) {
      logger.error("watch_reindex_failed", { file: filePath, error: String(err) });
    }
  });

  return watcher;
}

export async function watchTool(input: unknown) {
  await createWatcher(input, event => {
    logger.info("watch_event", event);
  });
  return { status: "watching" };
}
