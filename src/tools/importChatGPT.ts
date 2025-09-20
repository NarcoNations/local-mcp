import path from "path";
import { promises as fs } from "fs";
import { z } from "zod";
import { ResearchStore } from "../store/store.js";
import { convertChatGPTExport } from "../chatgpt/convert.js";

const InputSchema = z.object({
  exportPath: z.string().min(1),
  outDir: z.string().min(1).default("./docs/chatgpt-export-md"),
});

function resolveOutDir(store: ResearchStore, outDir: string) {
  const repoRoot = process.cwd();
  const abs = path.resolve(outDir);
  const rel = path.relative(repoRoot, abs);
  const allowedTop = new Set(["docs", "public", "fixtures", ".mcp-nn"]);

  if (!rel.startsWith("..") && !path.isAbsolute(rel)) {
    const top = rel.split(path.sep)[0] ?? "";
    if (!allowedTop.has(top)) {
      throw new Error(`Output directory must be under docs/public/fixtures/.mcp-nn: ${outDir}`);
    }
    return abs;
  }

  const allowedRoots = store.getRoots().map((root) => path.resolve(root));
  const matchesRoot = allowedRoots.some((root) => abs === root || abs.startsWith(`${root}${path.sep}`));
  if (!matchesRoot) {
    throw new Error(`Output directory must be inside the repository or configured roots: ${outDir}`);
  }
  return abs;
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

export async function handleImportChatGPT(store: ResearchStore, input: unknown) {
  const parsed = InputSchema.parse(input);
  const outDirAbs = resolveOutDir(store, parsed.outDir);
  await ensureDir(outDirAbs);
  const event = await convertChatGPTExport(path.resolve(parsed.exportPath), outDirAbs);
  await store.reindex([outDirAbs]);
  return {
    exportPath: parsed.exportPath,
    outDir: outDirAbs,
    conversations: event.conversations,
    filesWritten: event.filesWritten,
  };
}

export const importChatGPTSpec = {
  name: "import_chatgpt_export",
  description: "Convert a ChatGPT export archive into Markdown and reindex the output directory.",
  inputSchema: InputSchema,
};
