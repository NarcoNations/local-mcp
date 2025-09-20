#!/usr/bin/env node
import { loadConfig } from "./config.js";
import { getStore } from "./store/store.js";
import { logger } from "./utils/logger.js";

async function main() {
  const args = process.argv.slice(2);
  const config = await loadConfig();
  const store = await getStore(config);
  const stats = await store.reindex(args);
  logger.info("reindex-finished", { stats });
}

main().catch((err) => {
  logger.error("reindex-failed", { err: String(err) });
  process.exit(1);
});
