import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { AppConfig } from "../config.js";
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
import type { ApiManager } from "@vibelabz/api-manager";
import { createRunLLMTool, LLMRunSchema, LLMRunShape } from "../tools/llm.js";

export interface ToolKit {
  searchLocal: ReturnType<typeof createSearchLocalTool>;
  getDoc: ReturnType<typeof createGetDocTool>;
  reindex: ReturnType<typeof createReindexTool>;
  watch: ReturnType<typeof createWatchTool>;
  stats: ReturnType<typeof createStatsTool>;
  importChatGPT: ReturnType<typeof createImportChatGPTTool>;
  runLLM?: ReturnType<typeof createRunLLMTool>;
}

export interface ToolKitOptions {
  server?: McpServer;
  onWatchEvent?: (event: Record<string, unknown>, extra?: Record<string, unknown>) => void;
  apiManager?: ApiManager;
}

export function createToolKit(config: AppConfig, options?: ToolKitOptions): ToolKit {
  const searchLocal = createSearchLocalTool(config);
  const getDoc = createGetDocTool(config);
  const reindex = createReindexTool(config);
  const stats = createStatsTool(config);
  const watch = createWatchTool(config, (event, extra) => {
    options?.onWatchEvent?.(event, extra);
    if (!options?.server) return;
    const sessionId = (extra?.sessionId as string | undefined) ?? undefined;
    options.server
      .sendLoggingMessage({ level: "info", data: JSON.stringify(event) }, sessionId)
      .catch((err) => logger.warn("watch-notify-failed", { err: String(err) }));
  });
  const importChatGPT = createImportChatGPTTool(config);
  const llm = options?.apiManager ? createRunLLMTool(options.apiManager) : undefined;
  return { searchLocal, getDoc, reindex, watch, stats, importChatGPT, runLLM: llm };
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

  if (toolkit.runLLM) {
    server.registerTool(
      "run_llm",
      {
        title: "Run routed LLM",
        description: "Execute an LLM task through the configured provider policy and return the response.",
        inputSchema: LLMRunShape,
        annotations: { readOnlyHint: false, title: "Run LLM" },
      },
      async (args: unknown) => {
        const parsed = LLMRunSchema.parse(args);
        const result = await toolkit.runLLM!(parsed);
        const structured = JSON.parse(JSON.stringify(result)) as Record<string, unknown>;
        return {
          structuredContent: structured,
          content: [
            {
              type: "text" as const,
              text: result.output,
            },
          ],
        };
      }
    );
  }
}
