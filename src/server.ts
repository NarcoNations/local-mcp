import { maybeParseSamplePdf } from "./lib/maybe-parse-sample-pdf.js";
import "source-map-support/register";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { logger } from "./utils/logger.js";
import { createToolKit, registerMcpTools } from "./mcp/toolkit.js";
import { resolveApiManager } from "./lib/apiManager.js";

const SERVER_INFO = {
  name: "mcp-nn",
  version: "1.1.0",
};

async function main() {
  const config = await loadConfig();
  const apiManager = await resolveApiManager();
  const server = new McpServer(SERVER_INFO, {
    capabilities: {
      tools: {},
      logging: {},
    },
    instructions:
      "Local research MCP server. Use search_local for retrieval, get_doc for source text, reindex/watch to refresh, stats for corpus metrics, and import_chatgpt_export to convert ChatGPT exports.",
  });
  const toolkit = createToolKit(config, { server, apiManager });
  registerMcpTools(server, toolkit);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("mcp-server-started", { transport: "stdio" });
}

main().catch((err) => {
  logger.error("startup-failed", { err: String(err) });
  process.exit(1);
});

// Optional demo: try parsing SAMPLE_PDF if present (non-blocking)
if (process.env.DISABLE_SAMPLE_PDF!=="1") { void maybeParseSamplePdf(console); }
