import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  createFeedManager,
  createLLMRouter,
  type FeedRequest,
  type NormalizedFeedResponse,
  type NormalizedLLMResponse,
  type LLMPolicyRule,
  type LLMRoutingConfig,
} from "@vibelabz/api-manager";
import { AppConfig, saveConfig } from "../config.js";
import { logger } from "../utils/logger.js";
import {
  createSearchLocalTool,
  SearchLocalInputSchema,
  SearchLocalShape,
} from "../tools/searchLocal.js";
import { createGetDocTool, GetDocInputSchema, GetDocShape } from "../tools/getDoc.js";
import {
  createReindexTool,
  ReindexInputSchema,
  ReindexShape,
} from "../tools/reindex.js";
import {
  createWatchTool,
  WatchInputSchema,
  WatchShape,
} from "../tools/watch.js";
import { createStatsTool } from "../tools/stats.js";
import {
  createImportChatGPTTool,
  ImportChatGPTSchema,
  ImportChatGPTShape,
} from "../tools/importChatGPT.js";

const FeedRequestShape = {
  symbol: z.string().min(1),
  dataset: z.enum(["timeSeriesDaily", "companyOverview"] as const),
  providerId: z.string().optional(),
  forceRefresh: z.boolean().optional(),
};

const FeedRequestSchema = z.object(FeedRequestShape);

const LLMRunShape = {
  task: z.enum(["draft_copy", "summarize", "classify", "qa", "chat"] as const),
  prompt: z.string().min(1),
  modelHint: z.string().optional(),
  providerId: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(32000).optional(),
};

const LLMRunSchema = z.object(LLMRunShape);

const LLMPolicySchema: z.ZodType<LLMPolicyRule> = z.object({
  id: z.string().min(1),
  description: z.string().optional(),
  match: z
    .object({
      tasks: z.array(LLMRunSchema.shape.task).optional(),
      modelHints: z.array(z.string()).optional(),
      promptContains: z.array(z.string()).optional(),
      providerIds: z.array(z.string()).optional(),
    })
    .optional(),
  target: z.object({
    providerId: z.string().min(1),
    model: z.string().optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().min(1).max(32000).optional(),
  }),
});

const ProviderUpdateSchema = z.object({
  credentials: z
    .record(z.string(), z.object({ apiKey: z.string().optional(), baseUrl: z.string().optional() }))
    .optional(),
  feedCaching: z
    .object({ enabled: z.boolean().optional(), ttlSeconds: z.number().min(30).max(3600).optional() })
    .optional(),
  llmRouting: z
    .object({
      defaultProviderId: z.string().optional(),
      fallbackProviderId: z.string().optional(),
      policies: z.array(LLMPolicySchema).optional(),
    })
    .optional(),
}).strict();

export interface ToolKit {
  searchLocal: ReturnType<typeof createSearchLocalTool>;
  getDoc: ReturnType<typeof createGetDocTool>;
  reindex: ReturnType<typeof createReindexTool>;
  watch: ReturnType<typeof createWatchTool>;
  stats: ReturnType<typeof createStatsTool>;
  importChatGPT: ReturnType<typeof createImportChatGPTTool>;
  fetchFeed: (input: FeedRequest) => Promise<NormalizedFeedResponse>;
  runLLM: (input: z.infer<typeof LLMRunSchema>) => Promise<NormalizedLLMResponse>;
  listProviders: () => ProviderManifest;
  updateProviders: (input: unknown) => Promise<ProviderManifest>;
  applyConfig: (config: AppConfig) => void;
  getConfig: () => AppConfig;
}

export interface ProviderManifest {
  feeds: { id: string; label: string; description?: string }[];
  llm: { id: string; label: string; description?: string }[];
  routing: LLMRoutingConfig;
  feedCaching: { enabled: boolean; ttlSeconds: number };
  credentials: Record<string, { hasApiKey: boolean; baseUrl?: string | undefined }>;
}

export interface ToolKitOptions {
  server?: McpServer;
  onWatchEvent?: (event: Record<string, unknown>, extra?: Record<string, unknown>) => void;
}

export function createToolKit(config: AppConfig, options?: ToolKitOptions): ToolKit {
  let currentConfig: AppConfig = structuredClone(config);

  const feedManager = createFeedManager({
    credentials: currentConfig.providers.credentials,
    caching: currentConfig.providers.feedCaching,
  });
  const llmRouter = createLLMRouter({
    credentials: currentConfig.providers.credentials,
    routing: currentConfig.providers.llmRouting,
  });

  const emitWatch = (event: Record<string, unknown>, extra?: Record<string, unknown>) => {
    options?.onWatchEvent?.(event, extra);
    if (!options?.server) return;
    const sessionId = (extra?.sessionId as string | undefined) ?? undefined;
    options.server
      .sendLoggingMessage({ level: "info", data: JSON.stringify(event) }, sessionId)
      .catch((err) => logger.warn("watch-notify-failed", { err: String(err) }));
  };

  let searchLocalImpl = createSearchLocalTool(currentConfig);
  let getDocImpl = createGetDocTool(currentConfig);
  let reindexImpl = createReindexTool(currentConfig);
  let statsImpl = createStatsTool(currentConfig);
  let watchImpl = createWatchTool(currentConfig, emitWatch);
  let importChatGPTImpl = createImportChatGPTTool(currentConfig);

  const applyConfig = (next: AppConfig) => {
    currentConfig = structuredClone(next);
    searchLocalImpl = createSearchLocalTool(currentConfig);
    getDocImpl = createGetDocTool(currentConfig);
    reindexImpl = createReindexTool(currentConfig);
    statsImpl = createStatsTool(currentConfig);
    watchImpl = createWatchTool(currentConfig, emitWatch);
    importChatGPTImpl = createImportChatGPTTool(currentConfig);
    feedManager.updateOptions({
      credentials: currentConfig.providers.credentials,
      caching: currentConfig.providers.feedCaching,
    });
    llmRouter.updateOptions({
      credentials: currentConfig.providers.credentials,
      routing: currentConfig.providers.llmRouting,
    });
  };

  const fetchFeed = async (input: FeedRequest) => {
    const parsed = FeedRequestSchema.parse(input);
    return feedManager.fetch(parsed);
  };

  const runLLM = async (input: z.infer<typeof LLMRunSchema>) => {
    const parsed = LLMRunSchema.parse(input);
    return llmRouter.run(parsed);
  };

  const listProviders = (): ProviderManifest => {
    const feeds = feedManager.listProviders().map((provider) => provider.metadata);
    const llm = llmRouter.listProviders().map((provider) => provider.metadata);
    const credentials: ProviderManifest["credentials"] = {};
    for (const [key, entry] of Object.entries(currentConfig.providers.credentials ?? {})) {
      credentials[key] = {
        hasApiKey: Boolean((entry as any)?.apiKey),
        baseUrl: (entry as any)?.baseUrl,
      };
    }
    return {
      feeds,
      llm,
      routing: structuredClone(currentConfig.providers.llmRouting),
      feedCaching: structuredClone(currentConfig.providers.feedCaching),
      credentials,
    };
  };

  const updateProviders = async (input: unknown): Promise<ProviderManifest> => {
    const parsed = ProviderUpdateSchema.parse(input ?? {});
    const next = structuredClone(currentConfig);
    if (parsed.credentials) {
      next.providers.credentials ??= {} as Record<string, Record<string, string | undefined>>;
      for (const [id, credentials] of Object.entries(parsed.credentials)) {
        next.providers.credentials[id] = {
          ...(next.providers.credentials[id] ?? {}),
          ...credentials,
        } as Record<string, string | undefined>;
      }
    }
    if (parsed.feedCaching) {
      next.providers.feedCaching = {
        ...next.providers.feedCaching,
        ...parsed.feedCaching,
      };
    }
    if (parsed.llmRouting) {
      next.providers.llmRouting = {
        ...next.providers.llmRouting,
        ...parsed.llmRouting,
        policies:
          parsed.llmRouting.policies ?? structuredClone(next.providers.llmRouting?.policies ?? []),
      } as LLMRoutingConfig;
    }
    await saveConfig(next);
    applyConfig(next);
    return listProviders();
  };

  return {
    searchLocal: (input) => searchLocalImpl(input),
    getDoc: (input) => getDocImpl(input),
    reindex: (input) => reindexImpl(input),
    watch: (input, extra) => watchImpl(input, extra),
    stats: () => statsImpl(),
    importChatGPT: (input) => importChatGPTImpl(input),
    fetchFeed,
    runLLM,
    listProviders,
    updateProviders,
    applyConfig,
    getConfig: () => structuredClone(currentConfig),
  };
}

export function registerMcpTools(server: McpServer, toolkit: ToolKit): void {
  server.registerTool(
    "search_local",
    {
      title: "Hybrid local search",
      description: "Search PDFs, Markdown, text, Word, and Pages files across configured roots using dense + keyword retrieval.",
      inputSchema: SearchLocalShape,
      annotations: { readOnlyHint: true, title: "Search Local" },
    },
    async (args: z.infer<typeof SearchLocalInputSchema>) => {
      const result = await toolkit.searchLocal(args);
      return {
        structuredContent: result,
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  server.registerTool(
    "get_doc",
    {
      title: "Retrieve document text",
      description: "Read the full text for a file or a specific PDF/Pages page from the local index.",
      inputSchema: GetDocShape,
      annotations: { readOnlyHint: true, title: "Get Document" },
    },
    async (args: z.infer<typeof GetDocInputSchema>) => {
      const doc = await toolkit.getDoc(args);
      return {
        structuredContent: doc,
        content: [
          {
            type: "text" as const,
            text: doc.text.slice(0, 2000),
          },
        ],
      };
    }
  );

  server.registerTool(
    "reindex",
    {
      title: "Reindex paths",
      description: "Reindex the configured roots or provided paths to refresh the hybrid search corpus.",
      inputSchema: ReindexShape,
      annotations: { readOnlyHint: false, title: "Reindex" },
    },
    async (args: z.infer<typeof ReindexInputSchema>) => {
      const stats = await toolkit.reindex(args);
      return {
        structuredContent: stats,
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(stats),
          },
        ],
      };
    }
  );

  server.registerTool(
    "stats",
    {
      title: "Corpus stats",
      description: "Return aggregate metrics about the indexed corpus.",
      annotations: { readOnlyHint: true, title: "Stats" },
    },
    async () => {
      const stats = await toolkit.stats();
      const structured = JSON.parse(JSON.stringify(stats)) as Record<string, unknown>;
      return {
        structuredContent: structured,
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(stats, null, 2),
          },
        ],
      };
    }
  );

  server.registerTool(
    "watch",
    {
      title: "Watch paths",
      description: "Watch configured roots for changes and automatically trigger reindexing.",
      inputSchema: WatchShape,
      annotations: { readOnlyHint: false, title: "Watch" },
    },
    async (args: z.infer<typeof WatchInputSchema>, extra) => {
      const info = await toolkit.watch(args, { sessionId: extra?.sessionId });
      return {
        structuredContent: info,
        content: [
          {
            type: "text" as const,
            text: `Watching ${info.watching.length} path(s).`,
          },
        ],
      };
    }
  );

  server.registerTool(
    "import_chatgpt_export",
    {
      title: "Import ChatGPT export",
      description: "Convert a ChatGPT export ZIP into Markdown and reindex the output directory.",
      inputSchema: ImportChatGPTShape,
      annotations: { readOnlyHint: false, title: "Import ChatGPT Export" },
    },
    async (args: z.infer<typeof ImportChatGPTSchema>) => {
      const result = await toolkit.importChatGPT(args);
      return {
        structuredContent: result,
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  server.registerTool(
    "fetch_feed",
    {
      title: "Fetch market feed",
      description: "Retrieve normalised market data from configured feed providers with caching.",
      inputSchema: FeedRequestShape,
      annotations: { readOnlyHint: true, title: "Fetch Feed" },
    },
    async (args: z.infer<typeof FeedRequestSchema>) => {
      const result = await toolkit.fetchFeed(args);
      const structured = JSON.parse(JSON.stringify(result)) as Record<string, unknown>;
      return {
        structuredContent: structured,
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    }
  );

  server.registerTool(
    "route_llm",
    {
      title: "Policy-driven LLM route",
      description: "Execute an LLM run using policy-driven routing across configured providers.",
      inputSchema: LLMRunShape,
      annotations: { readOnlyHint: false, title: "Route LLM" },
    },
    async (args: z.infer<typeof LLMRunSchema>) => {
      const result = await toolkit.runLLM(args);
      const structured = JSON.parse(JSON.stringify(result)) as Record<string, unknown>;
      return {
        structuredContent: structured,
        content: [
          { type: "text" as const, text: result.output.slice(0, 2000) },
        ],
      };
    }
  );
}
