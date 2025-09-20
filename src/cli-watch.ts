#!/usr/bin/env node
import { createWatcher } from "./tools/watch.js";
import { createLogger } from "./utils/logger.js";

const logger = createLogger("cli-watch");

async function main() {
  const args = process.argv.slice(2).filter(arg => arg !== "--");
  const watcher = await createWatcher({ paths: args }, event => {
    logger.info("watch_event", event);
  });
  logger.info("watch_started", { paths: args.length ? args : "config.roots" });
  process.stdin.resume();
  process.on("SIGINT", () => {
    watcher.close();
    logger.info("watch_stopped");
    process.exit(0);
  });
}

main().catch(err => {
  logger.error("watch_failed", { error: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});
