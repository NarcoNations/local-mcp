import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadConfig } from "./config.js";
import {
  createSearchLocalTool,
  SearchLocalShape,
} from "./tools/searchLocal.js";
import { createGetDocTool, GetDocShape } from "./tools/getDoc.js";
import { createReindexTool, ReindexShape } from "./tools/reindex.js";
import { createWatchTool, WatchShape } from "./tools/watch.js";
import { createStatsTool } from "./tools/stats.js";
import {
  createImportChatGPTTool,
  ImportChatGPTShape,
} from "./tools/importChatGPT.js";
import type { LogLevel } from "./utils/logger.js";
import { logger } from "./utils/logger.js";
import type { AppConfig } from "./config.js";

type SearchLocalHandler = ReturnType<typeof createSearchLocalTool>;
type GetDocHandler = ReturnType<typeof createGetDocTool>;
type ReindexHandler = ReturnType<typeof createReindexTool>;
type WatchHandler = ReturnType<typeof createWatchTool>;
type StatsHandler = ReturnType<typeof createStatsTool>;
type ImportChatGPTHandler = ReturnType<typeof createImportChatGPTTool>;

export const SERVER_INFO = {
  name: "mcp-nn",
  version: "1.1.0",
};

export type RuntimeWatchEvent = {
  type: "watch";
  action: string;
  path: string;
  sessionId?: string;
  origin?: string;
  raw: Record<string, unknown>;
};

export type RuntimeActivityEvent = {
  type: "activity";
  activity: "reindex" | "import_chatgpt_export";
  status: "started" | "finished" | "error";
  origin?: string;
  detail?: unknown;
  error?: string;
};

export type RuntimeLogEvent = {
  type: "log";
  level: LogLevel;
  message: string;
  meta?: Record<string, unknown>;
};

type BaseRuntimeEvent = RuntimeWatchEvent | RuntimeActivityEvent | RuntimeLogEvent;

export type RuntimeEvent = BaseRuntimeEvent & { timestamp: string };

type WatchExtra = {
  sessionId?: string;
  origin?: string;
  notify?: (event: Record<string, unknown>) => void | Promise<void>;
};

export interface RuntimeTools {
  searchLocal(input: unknown): ReturnType<SearchLocalHandler>;
  getDoc(input: unknown): ReturnType<GetDocHandler>;
  reindex(input: unknown, extra?: { origin?: string }): ReturnType<ReindexHandler>;
  watch(input: unknown, extra?: WatchExtra): ReturnType<WatchHandler>;
  stats(): ReturnType<StatsHandler>;
  importChatGPT(input: unknown, extra?: { origin?: string }): ReturnType<ImportChatGPTHandler>;
}

export interface Runtime {
  config: AppConfig;
  tools: RuntimeTools;
  createServer(): McpServer;
  subscribe(listener: (event: RuntimeEvent) => void): () => void;
  emitLog(level: LogLevel, message: string, meta?: Record<string, unknown>): void;
}

export async function createRuntime(): Promise<Runtime> {
  const config = await loadConfig();
  const listeners = new Set<(event: RuntimeEvent) => void>();

  const emit = (event: BaseRuntimeEvent) => {
    const payload: RuntimeEvent = { ...event, timestamp: new Date().toISOString() };
    for (const listener of listeners) {
      try {
        listener(payload);
      } catch (error) {
        logger.warn("runtime-listener-error", { error: error instanceof Error ? error.message : String(error) });
      }
    }
  };

  const searchLocal: SearchLocalHandler = createSearchLocalTool(config);
  const getDoc: GetDocHandler = createGetDocTool(config);
  const reindexInternal: ReindexHandler = createReindexTool(config);
  const statsInternal: StatsHandler = createStatsTool(config);
  const importChatGPTInternal: ImportChatGPTHandler = createImportChatGPTTool(config);
  const watchInternal: WatchHandler = createWatchTool(config, (event, extra) => {
    const sessionId = typeof extra?.sessionId === "string" ? extra.sessionId : undefined;
    const origin = typeof extra?.origin === "string" ? extra.origin : undefined;
    emit({
      type: "watch",
      action: String(event.action ?? ""),
      path: String(event.path ?? ""),
      sessionId,
      origin,
      raw: event,
    });
    const notify = extra?.notify;
    if (typeof notify === "function") {
      Promise.resolve(notify(event)).catch((error) => {
        logger.warn("watch-notify-error", { error: error instanceof Error ? error.message : String(error) });
      });
    }
  });

  const tools: RuntimeTools = {
    searchLocal: async (input) => {
      return await searchLocal(input);
    },
    getDoc: async (input) => {
      return await getDoc(input);
    },
    reindex: async (input, extra) => {
      emit({ type: "activity", activity: "reindex", status: "started", origin: extra?.origin });
      try {
        const result = await reindexInternal(input);
        emit({ type: "activity", activity: "reindex", status: "finished", origin: extra?.origin, detail: result });
        return result;
      } catch (error) {
        emit({
          type: "activity",
          activity: "reindex",
          status: "error",
          origin: extra?.origin,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    watch: async (input, extra) => {
      const merged: WatchExtra = { ...extra };
      if (extra?.sessionId) merged.sessionId = extra.sessionId;
      if (extra?.origin) merged.origin = extra.origin;
      if (extra?.notify) merged.notify = extra.notify;
      return await watchInternal(input, merged as Record<string, unknown>);
    },
    stats: async () => {
      return await statsInternal();
    },
    importChatGPT: async (input, extra) => {
      emit({ type: "activity", activity: "import_chatgpt_export", status: "started", origin: extra?.origin });
      try {
        const result = await importChatGPTInternal(input);
        emit({
          type: "activity",
          activity: "import_chatgpt_export",
          status: "finished",
          origin: extra?.origin,
          detail: result,
        });
        return result;
      } catch (error) {
        emit({
          type: "activity",
          activity: "import_chatgpt_export",
          status: "error",
          origin: extra?.origin,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
  };

  function registerTools(server: McpServer): void {
    server.registerTool(
      "search_local",
      {
        title: "Hybrid local search",
        description:
          "Search PDFs, Markdown, text, Word, and Pages files across configured roots using dense + keyword retrieval.",
        inputSchema: SearchLocalShape,
        annotations: { readOnlyHint: true, title: "Search Local" },
      },
      async (args) => {
        const result = await tools.searchLocal(args);
        return {
          structuredContent: result,
          content: [
            {
              type: "text",
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
      async (args) => {
        const doc = await tools.getDoc(args);
        return {
          structuredContent: doc,
          content: [
            {
              type: "text",
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
      async (args) => {
        const stats = await tools.reindex(args, { origin: "mcp" });
        return {
          structuredContent: stats,
          content: [
            {
              type: "text",
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
        const stats = await tools.stats();
        const structured = JSON.parse(JSON.stringify(stats)) as Record<string, unknown>;
        return {
          structuredContent: structured,
          content: [
            {
              type: "text",
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
      async (args, extra) => {
        const info = await tools.watch(args, {
          sessionId: extra?.sessionId,
          origin: "mcp",
          notify: (event) =>
            server
              .sendLoggingMessage(
                {
                  level: "info",
                  data: JSON.stringify(event),
                },
                extra?.sessionId
              )
              .catch((error) => logger.warn("watch-notify-failed", { error: error instanceof Error ? error.message : String(error) })),
        });
        return {
          structuredContent: info,
          content: [
            {
              type: "text",
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
      async (args) => {
        const result = await tools.importChatGPT(args, { origin: "mcp" });
        return {
          structuredContent: result,
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );
  }

  return {
    config,
    tools,
    createServer: () => {
      const server = new McpServer(SERVER_INFO, {
        capabilities: {
          tools: {},
          logging: {},
        },
        instructions:
          "Local research MCP server. Use search_local for retrieval, get_doc for source text, reindex/watch to refresh, stats for corpus metrics, and import_chatgpt_export to convert ChatGPT exports.",
      });
      registerTools(server);
      return server;
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    emitLog: (level, message, meta) => {
      emit({ type: "log", level, message, meta });
    },
  };
}
