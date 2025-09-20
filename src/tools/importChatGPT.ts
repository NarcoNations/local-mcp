import path from "path";
import { spawn } from "child_process";
import { z } from "zod";
import { Store, reindexPaths } from "../store/store.js";
import { FSGuard } from "../utils/fs-guard.js";

const InputSchema = z.object({
  exportPath: z.string().min(1),
  outDir: z.string().min(1).default("./docs/chatgpt-export-md")
});

type EventEmitter = (event: Record<string, unknown>) => void;

function parseLastJson(line: string): Record<string, any> | null {
  try {
    return JSON.parse(line.trim());
  } catch {
    return null;
  }
}

export function createImportChatGPTTool(store: Store, emit: EventEmitter) {
  return {
    name: "import_chatgpt_export",
    description: "Convert a ChatGPT export ZIP folder into Markdown and reindex it.",
    inputSchema: InputSchema,
    jsonSchema: {
      type: "object",
      properties: {
        exportPath: { type: "string" },
        outDir: { type: "string", default: "./docs/chatgpt-export-md" }
      },
      required: ["exportPath"],
      additionalProperties: false
    },
    handler: async (raw: unknown) => {
      const input = InputSchema.parse(raw ?? {});
      const guard = await FSGuard.create(store.getConfig().roots);
      const outAbs = await guard.resolvePath(input.outDir);
      const scriptPath = path.join(process.cwd(), "scripts", "chatgpt-export-to-md.ts");
      const tsNodeBin = path.join(process.cwd(), "node_modules", "ts-node", "dist", "bin.js");
      const command = process.execPath;
      const args = [tsNodeBin, scriptPath, "--", input.exportPath, outAbs];
      emit({ event: "import", action: "start", outDir: outAbs });
      const converterResult = await new Promise<Record<string, any> | null>((resolve, reject) => {
        const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
        let lastJson: Record<string, any> | null = null;
        child.stdout.on("data", (data) => {
          const lines = String(data).trim().split(/\r?\n/);
          for (const line of lines) {
            const parsed = parseLastJson(line);
            if (parsed) {
              lastJson = parsed;
            }
          }
        });
        child.stderr.on("data", (data) => process.stderr.write(data));
        child.on("error", reject);
        child.on("close", (code) => {
          if (code !== 0) {
            return reject(new Error(`converter exited with code ${code}`));
          }
          resolve(lastJson);
        });
      });
      const filesWritten = converterResult?.meta?.filesWritten ?? 0;
      await reindexPaths(store, [outAbs]);
      emit({ event: "import", action: "complete", outDir: outAbs, filesWritten });
      return {
        filesWritten,
        conversations: converterResult?.meta?.conversations ?? filesWritten,
        outDir: outAbs
      };
    }
  };
}
