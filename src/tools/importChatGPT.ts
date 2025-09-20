import { spawn } from "node:child_process";
import path from "node:path";
import { promises as fs } from "node:fs";
import { z } from "zod";
import type { KnowledgeStore } from "../store/store.js";

const InputSchema = z.object({
  exportPath: z.string().min(1),
  outDir: z.string().min(1).default("./docs/chatgpt-export-md"),
});

async function runConverter(exportPath: string, outDir: string): Promise<number> {
  const tsNodeBin = path.join(process.cwd(), "node_modules", ".bin", "ts-node");
  const script = path.join(process.cwd(), "scripts", "chatgpt-export-to-md.ts");
  await fs.mkdir(outDir, { recursive: true });
  return new Promise((resolve, reject) => {
    const child = spawn(tsNodeBin, [script, "--", exportPath, outDir], { stdio: ["ignore", "pipe", "pipe"] });
    let filesWritten = 0;
    child.stdout.on("data", (data) => {
      const lines = String(data).trim().split(/\r?\n/);
      for (const line of lines) {
        try {
          const evt = JSON.parse(line);
          if (evt?.meta?.filesWritten) filesWritten = evt.meta.filesWritten;
        } catch {}
      }
    });
    child.stderr.on("data", (data) => process.stderr.write(data));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) return reject(new Error(`converter exited with code ${code}`));
      resolve(filesWritten);
    });
  });
}

export async function importChatGPT(store: KnowledgeStore, input: unknown, _context?: { emit: (event: unknown) => void }) {
  const parsed = InputSchema.parse(input);
  const outDirAbs = path.resolve(process.cwd(), parsed.outDir);
  const filesWritten = await runConverter(parsed.exportPath, outDirAbs);
  const indexed = await store.indexPaths([outDirAbs]);
  const payload = { filesWritten, outDir: outDirAbs, indexed };
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(payload, null, 2),
      },
    ],
    structuredContent: payload,
  };
}

export const importChatGPTSpec = {
  name: "import_chatgpt_export",
  description: "Convert a ChatGPT export JSON bundle to Markdown and index it.",
  inputSchema: InputSchema,
  handler: importChatGPT,
};
