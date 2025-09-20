#!/usr/bin/env node
import { reindexPaths } from "./store/store.js";
import { createLogger } from "./utils/logger.js";

const logger = createLogger("cli-index");

async function main() {
  const args = process.argv.slice(2).filter(arg => arg !== "--");
  const paths = args.length ? args : undefined;
  const result = await reindexPaths(paths);
  logger.info("reindex_complete", { ...result });
  console.log(JSON.stringify(result));
}

main().catch(err => {
  logger.error("reindex_failed", { error: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});
