import { loadConfig } from "./config.js";
import { ResearchStore } from "./store/store.js";
import { logger } from "./utils/logger.js";

async function main() {
  const { config } = await loadConfig();
  const store = new ResearchStore(config);
  await store.ready();
  const paths = process.argv.slice(2);
  const close = await store.watch(paths, (event: { event: string; path: string }) => logger.info("watch", event));

  const shutdown = async () => {
    logger.info("watch-stop", {});
    await close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  await new Promise(() => {});
}

main().catch((err) => {
  logger.error("cli-watch-failed", { err: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});
