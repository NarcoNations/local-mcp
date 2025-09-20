import { loadConfig } from "./config.js";
import { ResearchStore } from "./store/store.js";
import { logger } from "./utils/logger.js";

async function main() {
  const { config } = await loadConfig();
  const store = new ResearchStore(config);
  await store.ready();
  const paths = process.argv.slice(2);
  const summary = await store.reindex(paths);
  logger.info("reindex-complete", { ...summary });
}

main().catch((err) => {
  logger.error("cli-index-failed", { err: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});
