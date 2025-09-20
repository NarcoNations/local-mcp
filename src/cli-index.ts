#!/usr/bin/env node
import { ensureConfig } from "./config.js";
import { KnowledgeStore } from "./store/store.js";

async function main() {
  const argsIndex = process.argv.indexOf("--");
  const paths = argsIndex >= 0 ? process.argv.slice(argsIndex + 1) : process.argv.slice(2);
  const config = await ensureConfig();
  const store = new KnowledgeStore(config);
  await store.init();
  const result = await store.indexPaths(paths);
  process.stdout.write(`${JSON.stringify({ level: "info", msg: "indexed", result })}\n`);
}

main().catch((err) => {
  process.stderr.write(`${JSON.stringify({ level: "error", msg: "index_failed", error: String(err) })}\n`);
  process.exit(1);
});
