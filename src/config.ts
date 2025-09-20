import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import type { AppConfig } from "./types.js";

const DEFAULT_CONFIG: AppConfig = {
  roots: {
    roots: ["./docs", "./public/dossiers", "./docs/chatgpt-export-md"],
    include: [".pdf", ".md", ".txt", ".docx", ".pages"],
    exclude: ["**/node_modules/**", ".git/**"],
  },
  index: {
    chunkSize: 3500,
    chunkOverlap: 120,
    ocrEnabled: true,
    ocrTriggerMinChars: 100,
    useSQLiteVSS: false,
    model: "Xenova/all-MiniLM-L6-v2",
    maxFileSizeMB: 200,
    concurrency: 2,
    languages: ["eng"],
  },
  out: {
    dataDir: ".mcp-nn",
  },
};

const ConfigSchema = z.object({
  roots: z.object({
    roots: z.array(z.string()),
    include: z.array(z.string()),
    exclude: z.array(z.string()),
  }),
  index: z.object({
    chunkSize: z.number().min(500),
    chunkOverlap: z.number().min(0),
    ocrEnabled: z.boolean(),
    ocrTriggerMinChars: z.number().min(0),
    useSQLiteVSS: z.boolean(),
    model: z.string().min(1),
    maxFileSizeMB: z.number().min(1).optional(),
    concurrency: z.number().min(1).optional(),
    languages: z.array(z.string()).optional(),
  }),
  out: z.object({
    dataDir: z.string().min(1),
    modelCacheDir: z.string().optional(),
  }),
});

export async function ensureConfig(): Promise<AppConfig> {
  const dataDir = process.env.MCP_NN_DATA_DIR || DEFAULT_CONFIG.out.dataDir;
  const configDir = path.resolve(process.cwd(), dataDir);
  await fs.mkdir(configDir, { recursive: true });
  const configPath = path.join(configDir, "config.json");

  let config: AppConfig = {
    ...DEFAULT_CONFIG,
    out: { ...DEFAULT_CONFIG.out, dataDir },
  };

  try {
    const raw = await fs.readFile(configPath, "utf8");
    const parsed = ConfigSchema.parse(JSON.parse(raw));
    config = { ...parsed, out: { ...parsed.out, dataDir: parsed.out.dataDir || dataDir } };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      throw err;
    }
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), "utf8");
  }

  if (process.env.TRANSFORMERS_CACHE) {
    config.out.modelCacheDir = process.env.TRANSFORMERS_CACHE;
  }

  return config;
}

export function resolveDataPath(config: AppConfig, ...parts: string[]): string {
  return path.join(process.cwd(), config.out.dataDir, ...parts);
}

export function projectRoot(): string {
  const __filename = fileURLToPath(import.meta.url);
  return path.dirname(path.dirname(__filename));
}

export const DEFAULTS = DEFAULT_CONFIG;
