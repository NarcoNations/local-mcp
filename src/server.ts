import "source-map-support/register";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerMcpTools } from "./mcp/toolkit.js";
import { logger } from "./utils/logger.js";

const SERVER_INFO = {
  name: "mcp-memory-server",
  version: "0.2.0",
};

async function main() {
  const server = new McpServer(SERVER_INFO, {
    capabilities: {
      tools: {},
      logging: {},
    },
    instructions:
      "Use search_corpus for hybrid retrieval, add_documents to import new material, get_document for details, list_sources for provenance, and link_items to build relationships.",
  });

  registerMcpTools(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("mcp-server-started", { transport: "stdio" });
}

main().catch((err) => {
  logger.error("startup-failed", { err: String(err) });
  process.exit(1);
});
