import { promises as fs } from "fs";
import path from "path";
import { AppConfig } from "./types.js";
import { logger } from "./utils/logger.js";

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

function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result: Record<string, any> = { ...target };
  for (const [key, value] of Object.entries(source)) {
    if (value === undefined) continue;
    const current = (result as Record<string, any>)[key];
    if (Array.isArray(value)) {
      (result as Record<string, any>)[key] = [...value];
    } else if (value && typeof value === "object" && current && typeof current === "object" && !Array.isArray(current)) {
      (result as Record<string, any>)[key] = deepMerge(current, value as any);
    } else {
      (result as Record<string, any>)[key] = value;
    }
  }
  return result as T;
}

export async function loadConfig(): Promise<AppConfig> {
  const dataDirOverride = process.env.MCP_NN_DATA_DIR;
  const baseConfig: AppConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  if (dataDirOverride) {
    baseConfig.out.dataDir = dataDirOverride;
  }

  const dataDir = path.resolve(process.cwd(), baseConfig.out.dataDir);
  await fs.mkdir(dataDir, { recursive: true });
  const configPath = path.join(dataDir, "config.json");

  let userConfig: Partial<AppConfig> = {};
  try {
    const raw = await fs.readFile(configPath, "utf8");
    userConfig = JSON.parse(raw);
  } catch (err: any) {
    if (err.code !== "ENOENT") {
      logger.warn("config-load-failed", { error: err.message });
    }
  }

  const merged = deepMerge(baseConfig, userConfig);
  merged.out.dataDir = dataDir;
  if (process.env.TRANSFORMERS_CACHE) {
    merged.out.modelCacheDir = process.env.TRANSFORMERS_CACHE;
  }

  await fs.writeFile(configPath, JSON.stringify({ ...merged, out: { ...merged.out, dataDir: path.relative(process.cwd(), merged.out.dataDir) } }, null, 2));
  return merged;
}
