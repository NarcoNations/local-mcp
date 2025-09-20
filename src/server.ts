import "source-map-support/register";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { ResearchStore } from "./store/store.js";
import { logger } from "./utils/logger.js";
import { searchLocalSpec, handleSearchLocal } from "./tools/searchLocal.js";
import { getDocSpec, handleGetDoc } from "./tools/getDoc.js";
import { reindexSpec, handleReindex } from "./tools/reindex.js";
import { statsSpec, handleStats } from "./tools/stats.js";
import { watchSpec, handleWatch } from "./tools/watch.js";
import { importChatGPTSpec, handleImportChatGPT } from "./tools/importChatGPT.js";
import { onModelStatus } from "./pipeline/embed.js";

function asResult(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

async function main() {
  const { config } = await loadConfig();
  const store = new ResearchStore(config);
  await store.ready();

  const server = new McpServer({ name: "mcp-nn", version: "1.1.0" }, {
    instructions:
      "Local research MCP server. Use search_local, get_doc, reindex, watch, stats, and import_chatgpt_export to manage the corpus.",
  });

  const activeWatchers: Array<() => Promise<void>> = [];

  onModelStatus(async (status) => {
    await server.server.sendLoggingMessage({ level: "info", message: JSON.stringify({ event: "model", status }) });
  });

  server.registerTool(
    searchLocalSpec.name,
    {
      description: searchLocalSpec.description,
    },
    async (args) => {
      const data = await handleSearchLocal(store, args);
      return asResult(data);
    },
  );

  server.registerTool(
    getDocSpec.name,
    {
      description: getDocSpec.description,
    },
    async (args) => {
      const doc = await handleGetDoc(store, args);
      return asResult(doc);
    },
  );

  server.registerTool(
    reindexSpec.name,
    {
      description: reindexSpec.description,
    },
    async (args) => {
      const summary = await handleReindex(store, args);
      return asResult(summary);
    },
  );

  server.registerTool(
    statsSpec.name,
    { description: statsSpec.description },
    async () => {
      const stats = await handleStats(store);
      return asResult(stats);
    },
  );

  server.registerTool(
    watchSpec.name,
    {
      description: watchSpec.description,
    },
    async (args, extra) => {
      const { result, close } = await handleWatch(store, args, async (event) => {
        const payload = { event: "watch", action: event.event, path: event.path };
        await server.server.sendLoggingMessage({ level: "info", message: JSON.stringify(payload) }, extra.sessionId);
      });
      activeWatchers.push(close);
      return asResult({ watching: result.watching });
    },
  );

  server.registerTool(
    importChatGPTSpec.name,
    {
      description: importChatGPTSpec.description,
    },
    async (args) => {
      const summary = await handleImportChatGPT(store, args);
      return asResult(summary);
    },
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);

  const shutdown = async () => {
    logger.info("shutdown", {});
    for (const close of activeWatchers.splice(0, activeWatchers.length)) {
      try {
        await close();
      } catch (err) {
        logger.warn("watch-close-error", { err: err instanceof Error ? err.message : String(err) });
      }
    }
    await server.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  logger.info("mcp-server-started", { transport: "stdio" });
}

main().catch((err) => {
  logger.error("server-crash", { err: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});
