import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { AppConfig } from "./types.js";
import { ensureDir } from "./utils/fs-guard.js";
import { createLogger } from "./utils/logger.js";

const logger = createLogger("config");

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

function resolveDataDir(configDir: string): string {
  if (process.env.MCP_NN_DATA_DIR) {
    return path.resolve(process.cwd(), process.env.MCP_NN_DATA_DIR);
  }
  return path.resolve(process.cwd(), configDir);
}

export async function loadConfig(): Promise<AppConfig> {
  const dataDir = resolveDataDir(DEFAULT_CONFIG.out.dataDir);
  const dataConfigPath = path.join(dataDir, "config.json");

  await ensureDir(dataDir);

  let config: AppConfig = {
    ...DEFAULT_CONFIG,
    out: {
      ...DEFAULT_CONFIG.out,
      dataDir,
      modelCacheDir: process.env.TRANSFORMERS_CACHE
        ? path.resolve(process.env.TRANSFORMERS_CACHE)
        : undefined,
    },
  };

  try {
    const raw = await fs.readFile(dataConfigPath, "utf8");
    config = { ...config, ...JSON.parse(raw) };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      logger.warn("config_read_failed", { error: String(err) });
    }
  }

  if (process.env.MCP_NN_ROOTS) {
    const roots = process.env.MCP_NN_ROOTS.split(path.delimiter).filter(Boolean);
    if (roots.length) {
      config = { ...config, roots: { ...config.roots, roots } };
    }
  }

  await fs.writeFile(dataConfigPath, JSON.stringify(config, null, 2), "utf8");

  return config;
}

export function getModelCacheDir(config: AppConfig): string | undefined {
  if (config.out.modelCacheDir) return config.out.modelCacheDir;
  const cache = process.env.TRANSFORMERS_CACHE;
  return cache ? path.resolve(cache) : undefined;
}

export const PROJECT_ROOT = path.resolve(process.cwd());
export const SRC_DIR = path.dirname(fileURLToPath(import.meta.url));
