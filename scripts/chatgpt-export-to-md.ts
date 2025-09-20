// scripts/chatgpt-export-to-md.ts
// Usage: npm run chatgpt:to-md -- /path/to/ChatGPT-export [outDir]
import { convertChatGPTExport } from "../src/chatgpt/convert.js";

async function main() {
  const argIdx = process.argv.findIndex((a) => a === "--");
  const exportRoot = process.argv[argIdx >= 0 ? argIdx + 1 : 2] as string | undefined;
  const outDirArg = process.argv[argIdx >= 0 ? argIdx + 2 : 3] as string | undefined;
  if (!exportRoot) {
    console.error("Usage: npm run chatgpt:to-md -- /path/to/ChatGPT-export [outDir]");
    process.exit(1);
  }
  try {
    const result = await convertChatGPTExport(exportRoot, outDirArg);
    console.log(JSON.stringify({ level: "info", msg: "chatgpt_export_converted", meta: result }));
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

if (process.argv[1]?.endsWith("chatgpt-export-to-md.ts")) {
  main();
}
