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

export interface ProviderModelConfig {
  id: string;
  label?: string;
}

export interface BaseProviderSettings {
  id: string;
  type: string;
  label?: string;
  description?: string;
  disabled?: boolean;
  disabledReason?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface OpenAIProviderSettings extends BaseProviderSettings {
  type: "openai";
  apiKeyEnv?: string;
  apiKey?: string;
  baseUrl?: string;
  organization?: string;
  defaultModel?: string;
  models?: string[];
  temperature?: number;
}

export interface LocalProviderSettings extends BaseProviderSettings {
  type: "local";
  models?: string[];
  endpoint?: string;
  defaultResponsePrefix?: string;
}

export type ProviderSettings = OpenAIProviderSettings | LocalProviderSettings | BaseProviderSettings;

export interface LLMProvidersConfig {
  defaultProvider?: string;
  fallbackProvider?: string;
  cacheSeconds?: number;
  providers: ProviderSettings[];
}

export interface ProvidersConfig {
  llm: LLMProvidersConfig;
}

export interface AppConfig {
  roots: RootsConfig;
  index: IndexConfig;
  out: OutConfig;
  providers: ProvidersConfig;
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
  providers: {
    llm: {
      defaultProvider: "openai",
      fallbackProvider: "local",
      cacheSeconds: 300,
      providers: [
        {
          id: "openai",
          type: "openai",
          label: "OpenAI GPT-4o mini",
          apiKeyEnv: "OPENAI_API_KEY",
          models: ["gpt-4o-mini"],
          temperature: 0.6,
        },
        {
          id: "local",
          type: "local",
          label: "Local Mock",
          defaultResponsePrefix: "[LOCAL MOCK]",
          models: ["mock-local"],
        },
      ],
    },
  },
};

const CONFIG_FILE = "config.json";

function deepMerge<T extends Record<string, any>>(base: T, override: Partial<T>): T {
  const result: Record<string, any> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) continue;
    if (value && typeof value === "object" && !Array.isArray(value) && typeof base[key] === "object" && !Array.isArray(base[key])) {
      result[key] = deepMerge(base[key], value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result as T;
}

export async function loadConfig(): Promise<AppConfig> {
  const envDataDir = process.env.MCP_NN_DATA_DIR;
  const envModelCache = process.env.TRANSFORMERS_CACHE;

  let config: AppConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  if (envDataDir) {
    config.out.dataDir = envDataDir;
  }
  if (envModelCache) {
    config.out.modelCacheDir = envModelCache;
  }

  const dataDir = path.resolve(process.cwd(), config.out.dataDir);
  await fs.mkdir(dataDir, { recursive: true });

  const configPath = path.join(dataDir, CONFIG_FILE);
  try {
    const raw = await fs.readFile(configPath, "utf8");
    const parsed = JSON.parse(raw) as Partial<AppConfig>;
    config = deepMerge(config, parsed);
  } catch (err: any) {
    if (err?.code !== "ENOENT") throw err;
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), "utf8");
  }

  // normalise paths to absolute for internal use but keep original arrays for persisted config
  config.roots.roots = config.roots.roots.map((root) => path.resolve(process.cwd(), root));

  if (config.out.modelCacheDir) {
    config.out.modelCacheDir = path.resolve(process.cwd(), config.out.modelCacheDir);
  }

  return config;
}

export async function saveConfig(config: AppConfig): Promise<void> {
  const dataDir = path.resolve(process.cwd(), config.out.dataDir);
  await fs.mkdir(dataDir, { recursive: true });
  const configPath = path.join(dataDir, CONFIG_FILE);
  await fs.writeFile(configPath, JSON.stringify(config, null, 2), "utf8");
}

export { DEFAULT_CONFIG };
