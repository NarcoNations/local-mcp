#!/usr/bin/env node
import chokidar from "chokidar";
import { ensureConfig } from "./config.js";
import { KnowledgeStore } from "./store/store.js";

async function main() {
  const argsIndex = process.argv.indexOf("--");
  const paths = argsIndex >= 0 ? process.argv.slice(argsIndex + 1) : process.argv.slice(2);
  const config = await ensureConfig();
  const store = new KnowledgeStore(config);
  await store.init();

  const watchTargets = paths.length ? paths : config.roots.roots;
  const watcher = chokidar.watch(watchTargets, { ignoreInitial: true });
  const queue = new Map<string, NodeJS.Timeout>();

  const scheduleIndex = (file: string) => {
    clearTimeout(queue.get(file));
    const timer = setTimeout(async () => {
      queue.delete(file);
      try {
        await store.indexPaths([file]);
        process.stdout.write(`${JSON.stringify({ event: "watch", action: "change", path: file })}\n`);
      } catch (err) {
        process.stderr.write(`${JSON.stringify({ event: "watch", action: "error", path: file, error: String(err) })}\n`);
      }
    }, 250);
    queue.set(file, timer);
  };

  watcher
    .on("add", scheduleIndex)
    .on("change", scheduleIndex)
    .on("unlink", async (file) => {
      await store.removePath(file);
      process.stdout.write(`${JSON.stringify({ event: "watch", action: "unlink", path: file })}\n`);
    });
}

main().catch((err) => {
  process.stderr.write(`${JSON.stringify({ level: "error", msg: "watch_failed", error: String(err) })}\n`);
  process.exit(1);
});
