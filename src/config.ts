import { promises as fs } from "fs";
import path from "path";
import type {
  ApiManagerConfig,
  FeedCachingConfig,
  LLMPolicyRule,
  LLMRoutingConfig,
  ProviderCredentials,
} from "../packages/api-manager/src/types.js";

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
  providers: ApiManagerConfig;
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
    credentials: {
      alphaVantage: { apiKey: undefined },
      openai: { apiKey: undefined, baseUrl: undefined },
    },
    feedCaching: {
      enabled: true,
      ttlSeconds: 60 * 5,
    },
    llmRouting: {
      defaultProviderId: "local",
      fallbackProviderId: "openai",
      policies: [
        {
          id: "openai-drafting",
          description: "Use OpenAI for drafting, QA, and conversational flows when hints mention GPT/OpenAI.",
          match: { tasks: ["draft_copy", "qa", "chat"], modelHints: ["gpt", "openai"] },
          target: { providerId: "openai", model: "gpt-4o-mini", temperature: 0.7 },
        },
        {
          id: "openai-summarize",
          description: "Prefer OpenAI summariser when prompts mention summary or bullets.",
          match: { tasks: ["summarize"], promptContains: ["summary", "bullet"] },
          target: { providerId: "openai", model: "gpt-4o-mini", temperature: 0.3 },
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

function ensureProviderShapes(config: AppConfig): void {
  config.providers.credentials ??= {} as ProviderCredentials;
  config.providers.credentials.alphaVantage ??= { apiKey: undefined };
  config.providers.credentials.openai ??= { apiKey: undefined };
  config.providers.feedCaching ??= { enabled: true, ttlSeconds: 300 } as FeedCachingConfig;
  config.providers.llmRouting ??= {
    defaultProviderId: "local",
    fallbackProviderId: "openai",
    policies: [],
  } as LLMRoutingConfig;
}

function applyEnvOverrides(config: AppConfig): void {
  const alphaKey = process.env.ALPHA_VANTAGE_KEY;
  if (alphaKey) {
    config.providers.credentials.alphaVantage = {
      ...(config.providers.credentials.alphaVantage ?? {}),
      apiKey: alphaKey,
    };
  }
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    config.providers.credentials.openai = {
      ...(config.providers.credentials.openai ?? {}),
      apiKey: openaiKey,
    };
  }
  const openaiBase = process.env.OPENAI_BASE_URL;
  if (openaiBase) {
    config.providers.credentials.openai = {
      ...(config.providers.credentials.openai ?? {}),
      baseUrl: openaiBase,
    };
  }
  const feedTtl = process.env.FEED_CACHE_TTL_SECONDS;
  if (feedTtl) {
    const ttl = Number(feedTtl);
    if (!Number.isNaN(ttl) && ttl > 0) {
      config.providers.feedCaching.ttlSeconds = ttl;
    }
  }
  const feedEnabled = process.env.FEED_CACHE_ENABLED;
  if (feedEnabled === "0" || feedEnabled === "false") {
    config.providers.feedCaching.enabled = false;
  }
  if (feedEnabled === "1" || feedEnabled === "true") {
    config.providers.feedCaching.enabled = true;
  }
  const defaultProvider = process.env.LLM_DEFAULT_PROVIDER;
  if (defaultProvider) {
    config.providers.llmRouting.defaultProviderId = defaultProvider;
  }
  const fallbackProvider = process.env.LLM_FALLBACK_PROVIDER;
  if (fallbackProvider) {
    config.providers.llmRouting.fallbackProviderId = fallbackProvider;
  }
  const policyEnv = process.env.LLM_ROUTING_POLICIES;
  if (policyEnv) {
    try {
      const parsed = JSON.parse(policyEnv) as LLMPolicyRule[];
      if (Array.isArray(parsed)) {
        config.providers.llmRouting.policies = parsed;
      }
    } catch (error) {
      console.warn("Failed to parse LLM_ROUTING_POLICIES", error);
    }
  }
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

  ensureProviderShapes(config);
  applyEnvOverrides(config);

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
