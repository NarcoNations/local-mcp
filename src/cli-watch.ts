import "source-map-support/register";
import { loadConfig } from "./config.js";
import { Store } from "./store/store.js";
import { createWatchTool } from "./tools/watch.js";
import { info, error } from "./utils/logger.js";

async function main() {
  const args = process.argv.slice(2);
  const config = await loadConfig();
  const store = await Store.init(config);
  const tool = createWatchTool(store, (event) => {
    process.stdout.write(JSON.stringify(event) + "\n");
  });
  await tool.handler({ paths: args });
  info("cli-watch-started", { paths: args });
  // keep process running
  await new Promise(() => {});
}

main().catch((err) => {
  error("cli-watch-failed", { error: (err as Error).message });
  process.exit(1);
});
