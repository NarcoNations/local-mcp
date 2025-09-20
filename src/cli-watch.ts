#!/usr/bin/env node
import { getAppContext } from "./app.js";
import { watch } from "./tools/watch.js";

async function main() {
  const args = process.argv.slice(2);
  const context = await getAppContext();
  await watch(context, args.length ? { paths: args } : {}, (event) => {
    process.stdout.write(`${JSON.stringify(event)}\n`);
  });
  process.stdin.resume();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
