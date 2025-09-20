import "source-map-support/register";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { FSWatcher } from "chokidar";
import type { ZodRawShape } from "zod";
import { ensureInitialized } from "./store/store.js";
import { searchLocal } from "./tools/searchLocal.js";
import { getDoc } from "./tools/getDoc.js";
import { reindexTool } from "./tools/reindex.js";
import { statsTool } from "./tools/stats.js";
import { createWatcher } from "./tools/watch.js";
import { importChatGPT } from "./tools/importChatGPT.js";
import { SearchLocalShape, GetDocShape, ReindexShape, WatchShape, ImportChatGPTShape } from "./store/schema.js";

const toRawShape = (shape: ZodRawShape | Readonly<ZodRawShape>): ZodRawShape => ({ ...shape }) as ZodRawShape;

const searchLocalSchema = toRawShape(SearchLocalShape);
const getDocSchema = toRawShape(GetDocShape);
const reindexSchema = toRawShape(ReindexShape);
const watchSchema = toRawShape(WatchShape);
const importChatGPTSchema = toRawShape(ImportChatGPTShape);

const serverInfo = {
  name: "mcp-nn",
  version: "1.1.0",
};

const instructions = [
  "NarcoNations.org offline research MCP server.",
  "Use search_local for hybrid dense/BM25 search.",
  "Use get_doc to fetch page-level content and citations.",
  "Use reindex to refresh the local corpus when files change.",
].join(" \n");

async function main() {
  await ensureInitialized();
  const mcpServer = new McpServer(serverInfo, { instructions });
  const activeWatchers = new Set<FSWatcher>();
  const registerTool = mcpServer.registerTool.bind(mcpServer) as (
    name: string,
    config: { description?: string; inputSchema?: ZodRawShape } & Record<string, unknown>,
    handler: (args: unknown) => Promise<any>
  ) => void;

  registerTool("search_local", {
    description: "Hybrid dense + keyword search across indexed research corpus.",
    inputSchema: searchLocalSchema,
  }, async args => {
    const result = await searchLocal(args);
    const lines = result.results.map(hit => `${hit.citation.filePath} (score ${hit.score.toFixed(3)})`);
    return {
      content: [
        {
          type: "text",
          text: lines.length ? lines.join("\n") : "No results",
        },
      ],
      structuredContent: result,
    };
  });

  registerTool("get_doc", {
    description: "Read indexed document text by path and optional page number.",
    inputSchema: getDocSchema,
  }, async args => {
    const result = await getDoc(args);
    return {
      content: [
        {
          type: "text",
          text: result.text.slice(0, 1200) || "",
        },
      ],
      structuredContent: result,
    };
  });

  registerTool("reindex", {
    description: "Rebuild the local index for the configured roots or specific paths.",
    inputSchema: reindexSchema,
  }, async args => {
    const summary = await reindexTool(args);
    return {
      content: [
        {
          type: "text",
          text: `Indexed: ${summary.indexed}, updated: ${summary.updated}, skipped: ${summary.skipped}`,
        },
      ],
      structuredContent: summary,
    };
  });

  mcpServer.registerTool("stats", {
    description: "Return index statistics (files, chunks, averages).",
  }, async () => {
    const stats = await statsTool();
    return {
      content: [
        {
          type: "text",
          text: `Files: ${stats.files}, chunks: ${stats.chunks}`,
        },
      ],
      structuredContent: stats,
    };
  });

  registerTool("watch", {
    description: "Watch configured directories for changes and reindex automatically.",
    inputSchema: watchSchema,
  }, async args => {
    const watcher = await createWatcher(args, event => {
      mcpServer.sendLoggingMessage({
        level: "info",
        logger: "mcp-nn-watch",
        data: event,
      }).catch(() => {});
    });
    activeWatchers.add(watcher);
    return {
      content: [
        {
          type: "text",
          text: "Watching for changes",
        },
      ],
      structuredContent: { status: "watching" },
    };
  });

  registerTool("import_chatgpt_export", {
    description: "Convert a ChatGPT export into Markdown and reindex the output directory.",
    inputSchema: importChatGPTSchema,
  }, async args => {
    const summary = await importChatGPT(args);
    return {
      content: [
        {
          type: "text",
          text: `Converted ${summary.filesWritten} chats into ${summary.outDir}`,
        },
      ],
      structuredContent: summary,
    };
  });

  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);

  const closeWatchers = async () => {
    await Promise.allSettled(Array.from(activeWatchers, watcher => watcher.close()));
    activeWatchers.clear();
  };

  process.on("SIGINT", async () => {
    await closeWatchers();
    await mcpServer.close();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await closeWatchers();
    await mcpServer.close();
    process.exit(0);
  });
}

main().catch(err => {
  console.error(JSON.stringify({ level: "error", msg: "startup_failed", error: err instanceof Error ? err.message : String(err) }));
  process.exit(1);
});
