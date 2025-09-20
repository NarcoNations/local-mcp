import { spawn } from "child_process";
import path from "path";
import { promises as fs } from "fs";
import { z } from "zod";
import { AppContext } from "../app.js";
import { reindex } from "./reindex.js";

const InputSchema = z.object({
  exportPath: z.string().min(1),
  outDir: z.string().min(1).default("./docs/chatgpt-export-md"),
});

type JsonEvent = { level: string; msg: string; meta?: Record<string, unknown> };

function parseLastJSON(buffer: string): JsonEvent | null {
  const lines = buffer.trim().split(/\r?\n/).reverse();
  for (const line of lines) {
    try {
      return JSON.parse(line);
    } catch {
      continue;
    }
  }
  return null;
}

async function ensureOutDir(outDir: string) {
  await fs.mkdir(outDir, { recursive: true });
}

function ensureWithinRepo(outDir: string) {
  const repoRoot = process.cwd();
  const relative = path.relative(repoRoot, outDir);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Output directory must be inside the repository: ${outDir}`);
  }
  const top = relative.split(path.sep)[0];
  if (top && !["docs", "public", "fixtures", ".mcp-nn"].includes(top)) {
    throw new Error(`Output directory must be under docs/public/fixtures/.mcp-nn: ${outDir}`);
  }
}

async function runConverter(exportPath: string, outDir: string): Promise<JsonEvent | null> {
  const tsNode = path.join(process.cwd(), "node_modules", "ts-node", "dist", "bin.js");
  const script = path.join(process.cwd(), "scripts", "chatgpt-export-to-md.ts");
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [tsNode, script, "--", exportPath, outDir], { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      process.stderr.write(chunk);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(`chatgpt-export-to-md exited with code ${code}`));
      }
      resolve(parseLastJSON(stdout));
    });
  });
}

export async function importChatGPT(context: AppContext, input: unknown) {
  const { exportPath, outDir } = InputSchema.parse(input ?? {});
  const outDirAbs = path.resolve(process.cwd(), outDir);
  ensureWithinRepo(outDirAbs);
  await ensureOutDir(outDirAbs);

  const convertEvent = await runConverter(exportPath, outDirAbs);
  const stats = await reindex(context, { paths: [outDirAbs] });
  return {
    filesWritten: convertEvent?.meta?.filesWritten ?? 0,
    conversations: convertEvent?.meta?.conversations ?? 0,
    outDir: path.relative(process.cwd(), outDirAbs),
    indexed: stats,
  };
}
