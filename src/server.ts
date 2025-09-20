import "source-map-support/register";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ensureConfig } from "./config.js";
import { KnowledgeStore } from "./store/store.js";
import { searchLocalSpec } from "./tools/searchLocal.js";
import { getDocSpec } from "./tools/getDoc.js";
import { reindexSpec } from "./tools/reindex.js";
import { watchSpec } from "./tools/watch.js";
import { statsSpec } from "./tools/stats.js";
import { importChatGPTSpec } from "./tools/importChatGPT.js";
import { logger } from "./utils/logger.js";

interface ToolSpec {
  name: string;
  description: string;
  inputSchema?: any;
  handler: (store: KnowledgeStore, input: unknown, context?: { emit: (event: unknown) => void; config: any }) => Promise<any>;
}

async function main() {
  const config = await ensureConfig();
  const store = new KnowledgeStore(config);
  await store.init();

  const server = new McpServer(
    {
      name: "mcp-nn",
      version: "1.1.0",
    },
    {
      capabilities: { logging: {} },
    }
  );

  const specs: ToolSpec[] = [searchLocalSpec, getDocSpec, reindexSpec, watchSpec, statsSpec, importChatGPTSpec];
  for (const spec of specs) {
    server.registerTool(
      spec.name,
      {
        description: spec.description,
        inputSchema: spec.inputSchema,
      },
      async (args: unknown) => {
        const emit = (event: unknown) => {
          void server.sendLoggingMessage({ level: "info", data: JSON.stringify(event) });
        };
        return spec.handler(store, args, { emit, config });
      }
    );
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("server-ready", { transport: "stdio" });
  process.stdin.resume();
}

main().catch((err) => {
  logger.error("startup_failed", { error: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});
