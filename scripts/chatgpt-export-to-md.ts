import path from "path";
import { fileURLToPath } from "url";

const outDirDefault = path.join(process.cwd(), "docs", "chatgpt-export-md");

async function getConverter() {
  try {
    const mod = await import("../dist/utils/chatgpt.js");
    return mod.convertChatGPTExport as (exportRoot: string, outDir: string) => Promise<{ filesWritten: number; conversations: number }>;
  } catch {
    const mod = await import("../src/utils/chatgpt.ts");
    return mod.convertChatGPTExport as (exportRoot: string, outDir: string) => Promise<{ filesWritten: number; conversations: number }>;
  }
}

async function main() {
  const argIdx = process.argv.findIndex((a) => a === "--");
  const exportRoot = process.argv[argIdx >= 0 ? argIdx + 1 : 2] as string | undefined;
  const outDirArg = process.argv[argIdx >= 0 ? argIdx + 2 : 3] as string | undefined;
  if (!exportRoot) {
    console.error("Usage: npm run chatgpt:to-md -- /path/to/ChatGPT-export [outDir]");
    process.exit(1);
  }

  try {
    const convert = await getConverter();
    const outDir = outDirArg || outDirDefault;
    const result = await convert(exportRoot, outDir);
    console.log(JSON.stringify({ level: "info", msg: "chatgpt_export_converted", meta: { ...result, outDir } }));
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

const entrypoint = fileURLToPath(import.meta.url);
if (process.argv[1] === entrypoint) {
  main();
}
