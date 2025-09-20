import { promises as fs } from "fs";
import path from "path";

export interface RootsConfig {
  roots: string[];
  include: string[];
  exclude: string[];
}

export interface IndexConfig {
  chunkSize: number;
  chunkOverlap: number;
  ocrEnabled: boolean;
  ocrTriggerMinChars: number;
  useSQLiteVSS: boolean;
  model: string;
  maxFileSizeMB?: number;
  concurrency?: number;
  languages?: string[];
}

export interface OutConfig {
  dataDir: string;
  modelCacheDir?: string;
}

export interface AppConfig {
  roots: RootsConfig;
  index: IndexConfig;
  out: OutConfig;
}

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

export interface ConfigLoadResult {
  config: AppConfig;
  configPath: string;
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function loadConfig(): Promise<ConfigLoadResult> {
  const dataDir = process.env.MCP_NN_DATA_DIR || DEFAULT_CONFIG.out.dataDir;
  const resolvedDataDir = path.resolve(process.cwd(), dataDir);
  await fs.mkdir(resolvedDataDir, { recursive: true });

  const configPath = path.join(resolvedDataDir, "config.json");
  let config: AppConfig = structuredClone(DEFAULT_CONFIG);

  if (await pathExists(configPath)) {
    try {
      const raw = await fs.readFile(configPath, "utf8");
      const parsed = JSON.parse(raw);
      config = {
        roots: { ...DEFAULT_CONFIG.roots, ...(parsed.roots ?? {}) },
        index: { ...DEFAULT_CONFIG.index, ...(parsed.index ?? {}) },
        out: { ...DEFAULT_CONFIG.out, ...(parsed.out ?? {}) },
      };
    } catch {
      // fall back to defaults and overwrite below
    }
  }

  if (process.env.TRANSFORMERS_CACHE) {
    config.out.modelCacheDir = process.env.TRANSFORMERS_CACHE;
  }

  if (!(await pathExists(configPath))) {
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), "utf8");
  }

  return { config, configPath };
}
