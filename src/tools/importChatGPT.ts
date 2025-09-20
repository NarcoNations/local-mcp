import { spawn } from "child_process";
import path from "path";
import { promises as fs } from "fs";
import { ImportChatGPTInput } from "../store/schema.js";
import { reindexPaths } from "../store/store.js";
function withinAllowed(outDir: string): boolean {
  const abs = path.resolve(outDir);
  const rel = path.relative(process.cwd(), abs);
  if (rel.startsWith("..") || path.isAbsolute(rel) && !abs.startsWith(process.cwd())) return false;
  const top = rel.split(path.sep)[0];
  return ["docs", "public", "fixtures", ".mcp-nn"].includes(top);
}

async function runConverter(exportPath: string, outDir: string): Promise<number> {
  const tsNode = path.join(process.cwd(), "node_modules", ".bin", "ts-node");
  const script = path.join(process.cwd(), "scripts", "chatgpt-export-to-md.ts");
  await fs.access(script);

  return new Promise((resolve, reject) => {
    const child = spawn(tsNode, [script, "--", exportPath, outDir], { stdio: ["ignore", "pipe", "pipe"] });
    let filesWritten = 0;
    child.stdout.on("data", data => {
      const line = String(data).trim();
      try {
        const evt = JSON.parse(line);
        if (evt?.meta?.filesWritten) {
          filesWritten = evt.meta.filesWritten;
        }
      } catch {
        // ignore non-JSON output
      }
    });
    child.stderr.on("data", data => process.stderr.write(data));
    child.on("error", reject);
    child.on("close", code => {
      if (code !== 0) {
        reject(new Error(`chatgpt-export-to-md exited with code ${code}`));
      } else {
        resolve(filesWritten);
      }
    });
  });
}

export async function importChatGPT(input: unknown) {
  const parsed = ImportChatGPTInput.parse(input ?? {});
  const outDirAbs = path.resolve(parsed.outDir);
  if (!withinAllowed(outDirAbs)) {
    throw new Error(`outDir must be inside docs/, public/, fixtures/, or .mcp-nn/: ${parsed.outDir}`);
  }

  await fs.mkdir(outDirAbs, { recursive: true });

  const filesWritten = await runConverter(parsed.exportPath, outDirAbs);
  const summary = await reindexPaths([outDirAbs]);

  return {
    filesWritten,
    outDir: outDirAbs,
    indexed: summary,
  };
}
