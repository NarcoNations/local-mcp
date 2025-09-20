#!/usr/bin/env node
import { loadConfig } from "./config.js";
import { createWatchTool } from "./tools/watch.js";
import { logger } from "./utils/logger.js";

async function main() {
  const args = process.argv.slice(2);
  const config = await loadConfig();
  const watch = createWatchTool(config, (event) => logger.info("watch", event));
  await watch({ paths: args });
  logger.info("watching", { paths: args.length ? args : config.roots.roots });
  process.stdin.resume();
}

main().catch((err) => {
  logger.error("watch-failed", { err: String(err) });
  process.exit(1);
});
