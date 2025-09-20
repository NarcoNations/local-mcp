#!/usr/bin/env node
import { getAppContext } from "./app.js";
import { reindex } from "./tools/reindex.js";

async function main() {
  const args = process.argv.slice(2);
  const context = await getAppContext();
  const stats = await reindex(context, args.length ? { paths: args } : {});
  process.stdout.write(`${JSON.stringify(stats)}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
