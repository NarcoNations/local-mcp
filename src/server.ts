import sourceMapSupport from "source-map-support";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolRequest,
} from "@modelcontextprotocol/sdk/types.js";
import { loadConfig } from "./config.js";
import { Store } from "./store/store.js";
import { createTools } from "./tools/index.js";
import { error } from "./utils/logger.js";

async function main() {
  sourceMapSupport.install();
  const config = await loadConfig();
  const store = await Store.init(config);
  const server = new Server({ name: "mcp-nn", version: "1.1.0" }, {
    capabilities: {
      tools: {},
      logging: {}
    }
  });

  const tools = createTools(store, (event) => {
    server
      .sendLoggingMessage({ level: "info", logger: "mcp-nn", data: event })
      .catch(() => undefined);
  });

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.jsonSchema
    }))
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
    const tool = tools.find((t) => t.name === request.params.name);
    if (!tool) {
      const message = `Unknown tool: ${request.params.name}`;
      return {
        content: [{ type: "text", text: message }],
        isError: true
      };
    }
    try {
      const args = tool.inputSchema ? tool.inputSchema.parse(request.params.arguments ?? {}) : request.params.arguments ?? {};
      const result = await tool.handler(args);
      const text = typeof result === "string" ? result : JSON.stringify(result, null, 2);
      return {
        content: [{ type: "text", text }],
        toolResult: result
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        content: [{ type: "text", text: `Error: ${message}` }],
        isError: true
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  error("server-failed", { error: (err as Error).message });
  process.exit(1);
});
