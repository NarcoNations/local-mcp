import "source-map-support/register";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getAppContext } from "./app.js";
import { searchLocal } from "./tools/searchLocal.js";
import { getDoc } from "./tools/getDoc.js";
import { reindex } from "./tools/reindex.js";
import { watch, closeWatchers } from "./tools/watch.js";
import { stats as statsTool } from "./tools/stats.js";
import { importChatGPT } from "./tools/importChatGPT.js";
import { logger } from "./utils/logger.js";

async function main() {
  const context = await getAppContext();
  const server = new McpServer(
    { name: "mcp-nn", version: "1.1.0" },
    { capabilities: { tools: {}, logging: {} } },
  );

  const searchSchema = {
    query: z.string().min(1),
    k: z.number().int().min(1).max(32).default(8),
    alpha: z.number().min(0).max(1).default(0.65),
    filters: z
      .object({
        type: z.array(z.enum(["pdf", "markdown", "text", "word", "pages"] as const)).optional(),
      })
      .optional(),
  } as const;

  server.tool("search_local", "Hybrid local search across the indexed corpus", searchSchema, async (args, _extra) => {
    const data = await searchLocal(context, args);
    return { content: [{ type: "text", text: JSON.stringify(data) }] };
  });

  const getDocSchema = {
    path: z.string().min(1),
    page: z.number().int().min(1).optional(),
  } as const;

  server.tool("get_doc", "Fetch a document or page from the indexed corpus", getDocSchema, async (args, _extra) => {
    const data = await getDoc(context, args);
    return { content: [{ type: "text", text: JSON.stringify(data) }] };
  });

  const reindexSchema = { paths: z.array(z.string()).optional() } as const;
  server.tool("reindex", "Reindex one or more paths", reindexSchema, async (args, _extra) => {
    const data = await reindex(context, args ?? {});
    return { content: [{ type: "text", text: JSON.stringify(data) }] };
  });

  const watchSchema = { paths: z.array(z.string()).optional() } as const;
  server.tool("watch", "Start filesystem watch and automatic reindexing", watchSchema, async (args, extra) => {
    const response = await watch(context, args ?? {}, (event) => {
      server.sendLoggingMessage({ level: "info", data: JSON.stringify(event) }, extra.sessionId).catch((err) => {
        logger.warn("watch-notify-failed", { error: err.message });
      });
    });
    return { content: [{ type: "text", text: JSON.stringify(response) }] };
  });

  server.tool("stats", "Return index statistics", {}, async (_args, _extra) => {
    const data = await statsTool(context);
    return { content: [{ type: "text", text: JSON.stringify(data) }] };
  });

  const importSchema = {
    exportPath: z.string().min(1),
    outDir: z.string().min(1).default("./docs/chatgpt-export-md"),
  } as const;
  server.tool("import_chatgpt_export", "Convert ChatGPT export and index it", importSchema, async (args, _extra) => {
    const data = await importChatGPT(context, args);
    return { content: [{ type: "text", text: JSON.stringify(data) }] };
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("server-started", { transport: "stdio" });

  const shutdown = async () => {
    logger.info("server-shutdown", {});
    await closeWatchers();
    await server.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  logger.error("server-error", { error: err.message });
  process.exit(1);
});
