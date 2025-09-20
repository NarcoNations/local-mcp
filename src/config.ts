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
    roots: [
      "./docs",
      "./public/dossiers",
      "./docs/chatggtp-export-md",
      "./docs/chatgpt-export-md"
    ],
    include: [".pdf", ".md", ".txt", ".docx", ".pages"],
    exclude: ["**/node_modules/**", ".git/**"]
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
    languages: ["eng"]
  },
  out: {
    dataDir: ".mcp-nn"
  }
};

const CONFIG_FILE = "config.json";

function mergeConfig(current: Partial<AppConfig> | undefined): AppConfig {
  if (!current) return { ...DEFAULT_CONFIG };
  return {
    roots: {
      roots: current?.roots?.roots ?? [...DEFAULT_CONFIG.roots.roots],
      include: current?.roots?.include ?? [...DEFAULT_CONFIG.roots.include],
      exclude: current?.roots?.exclude ?? [...DEFAULT_CONFIG.roots.exclude]
    },
    index: {
      chunkSize: current?.index?.chunkSize ?? DEFAULT_CONFIG.index.chunkSize,
      chunkOverlap: current?.index?.chunkOverlap ?? DEFAULT_CONFIG.index.chunkOverlap,
      ocrEnabled: current?.index?.ocrEnabled ?? DEFAULT_CONFIG.index.ocrEnabled,
      ocrTriggerMinChars: current?.index?.ocrTriggerMinChars ?? DEFAULT_CONFIG.index.ocrTriggerMinChars,
      useSQLiteVSS: current?.index?.useSQLiteVSS ?? DEFAULT_CONFIG.index.useSQLiteVSS,
      model: current?.index?.model ?? DEFAULT_CONFIG.index.model,
      maxFileSizeMB: current?.index?.maxFileSizeMB ?? DEFAULT_CONFIG.index.maxFileSizeMB,
      concurrency: current?.index?.concurrency ?? DEFAULT_CONFIG.index.concurrency,
      languages: current?.index?.languages ?? DEFAULT_CONFIG.index.languages
    },
    out: {
      dataDir: current?.out?.dataDir ?? DEFAULT_CONFIG.out.dataDir,
      modelCacheDir: current?.out?.modelCacheDir ?? DEFAULT_CONFIG.out.modelCacheDir
    }
  };
}

export async function loadConfig(): Promise<AppConfig> {
  const dataDir = process.env.MCP_NN_DATA_DIR || DEFAULT_CONFIG.out.dataDir;
  const resolvedDataDir = path.resolve(process.cwd(), dataDir);
  await fs.mkdir(resolvedDataDir, { recursive: true });
  const configPath = path.join(resolvedDataDir, CONFIG_FILE);
  let diskConfig: Partial<AppConfig> | undefined;
  try {
    const raw = await fs.readFile(configPath, "utf8");
    diskConfig = JSON.parse(raw) as Partial<AppConfig>;
  } catch (error) {
    diskConfig = undefined;
  }
  const effective = mergeConfig(diskConfig);
  effective.out.dataDir = resolvedDataDir;
  if (process.env.TRANSFORMERS_CACHE && !effective.out.modelCacheDir) {
    effective.out.modelCacheDir = process.env.TRANSFORMERS_CACHE;
  }
  await fs.writeFile(configPath, JSON.stringify(effective, null, 2), "utf8");
  return effective;
}

export function getDataDir(config: AppConfig): string {
  return config.out.dataDir;
}

export function getModelCacheDir(config: AppConfig): string | undefined {
  return config.out.modelCacheDir;
}
