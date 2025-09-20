import "source-map-support/register";
import { loadConfig } from "./config.js";
import { Store, reindexPaths } from "./store/store.js";
import { info, error } from "./utils/logger.js";

async function main() {
  const args = process.argv.slice(2);
  const config = await loadConfig();
  const store = await Store.init(config);
  const result = await reindexPaths(store, args);
  info("cli-index-complete", result);
  process.stdout.write(JSON.stringify(result) + "\n");
}

main().catch((err) => {
  error("cli-index-failed", { error: (err as Error).message });
  process.exit(1);
});
