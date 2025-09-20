import { maybeParseSamplePdf } from "./lib/maybe-parse-sample-pdf.js";
import "source-map-support/register";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { logger } from "./utils/logger.js";
import { createRuntime } from "./runtime.js";

async function main() {
  const runtime = await createRuntime();
  const server = runtime.createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("mcp-server-started", { transport: "stdio" });
}

main().catch((err) => {
  logger.error("startup-failed", { err: String(err) });
  process.exit(1);
});

// Optional demo: try parsing SAMPLE_PDF if present (non-blocking)
if (process.env.DISABLE_SAMPLE_PDF !== "1") {
  void maybeParseSamplePdf(console);
}
