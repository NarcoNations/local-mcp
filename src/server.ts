import "source-map-support/register";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { loadConfig } from "./config.js";
import { logger } from "./utils/logger.js";
import { createSearchLocalTool, SearchLocalInputSchema, SearchLocalShape } from "./tools/searchLocal.js";
import { createGetDocTool, GetDocInputSchema, GetDocShape } from "./tools/getDoc.js";
import { createReindexTool, ReindexInputSchema, ReindexShape } from "./tools/reindex.js";
import { createWatchTool, WatchInputSchema, WatchShape } from "./tools/watch.js";
import { createStatsTool } from "./tools/stats.js";
import { createImportChatGPTTool, ImportChatGPTSchema, ImportChatGPTShape } from "./tools/importChatGPT.js";

const SERVER_INFO = {
  name: "mcp-nn",
  version: "1.1.0",
};

async function main() {
  const config = await loadConfig();
  const server = new McpServer(SERVER_INFO, {
    capabilities: {
      tools: {},
      logging: {},
    },
    instructions:
      "Local research MCP server. Use search_local for retrieval, get_doc for source text, reindex/watch to refresh, stats for corpus metrics, and import_chatgpt_export to convert ChatGPT exports.",
  });

  const searchLocal = createSearchLocalTool(config);
  server.registerTool(
    "search_local",
    {
      title: "Hybrid local search",
      description: "Search PDFs, Markdown, text, Word, and Pages files across configured roots using dense + keyword retrieval.",
      inputSchema: SearchLocalShape,
      annotations: { readOnlyHint: true, title: "Search Local" },
    },
    async (args: z.infer<typeof SearchLocalInputSchema>) => {
      const result = await searchLocal(args);
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

  const getDoc = createGetDocTool(config);
  server.registerTool(
    "get_doc",
    {
      title: "Retrieve document text",
      description: "Read the full text for a file or a specific PDF/Pages page from the local index.",
      inputSchema: GetDocShape,
      annotations: { readOnlyHint: true, title: "Get Document" },
    },
    async (args: z.infer<typeof GetDocInputSchema>) => {
      const doc = await getDoc(args);
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

  const reindex = createReindexTool(config);
  server.registerTool(
    "reindex",
    {
      title: "Reindex paths",
      description: "Reindex the configured roots or provided paths to refresh the hybrid search corpus.",
      inputSchema: ReindexShape,
      annotations: { readOnlyHint: false, title: "Reindex" },
    },
    async (args: z.infer<typeof ReindexInputSchema>) => {
      const stats = await reindex(args);
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

  const statsTool = createStatsTool(config);
  server.registerTool(
    "stats",
    {
      title: "Corpus stats",
      description: "Return aggregate metrics about the indexed corpus.",
      annotations: { readOnlyHint: true, title: "Stats" },
    },
    async (_args) => {
      const stats = await statsTool();
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

  const watchTool = createWatchTool(config, (event, extra) => {
    const sessionId = (extra?.sessionId as string | undefined) ?? undefined;
    server
      .sendLoggingMessage(
        {
          level: "info",
          data: JSON.stringify(event),
        },
        sessionId
      )
      .catch((err) => logger.warn("watch-notify-failed", { err: String(err) }));
  });
  server.registerTool(
    "watch",
    {
      title: "Watch paths",
      description: "Watch configured roots for changes and automatically trigger reindexing.",
      inputSchema: WatchShape,
      annotations: { readOnlyHint: false, title: "Watch" },
    },
    async (args: z.infer<typeof WatchInputSchema>, extra) => {
      const info = await watchTool(args, { sessionId: extra?.sessionId });
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

  const importChatGPT = createImportChatGPTTool(config);
  server.registerTool(
    "import_chatgpt_export",
    {
      title: "Import ChatGPT export",
      description: "Convert a ChatGPT export ZIP into Markdown and reindex the output directory.",
      inputSchema: ImportChatGPTShape,
      annotations: { readOnlyHint: false, title: "Import ChatGPT Export" },
    },
    async (args: z.infer<typeof ImportChatGPTSchema>) => {
      const result = await importChatGPT(args);
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

  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("mcp-server-started", { transport: "stdio" });
}

main().catch((err) => {
  logger.error("startup-failed", { err: String(err) });
  process.exit(1);
});
