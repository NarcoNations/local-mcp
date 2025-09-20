import express, { type Request, type Response } from "express";
import path from "node:path";
import fs from "node:fs";
import { EventEmitter } from "node:events";
import { AddressInfo } from "node:net";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { ZodError } from "zod";
import { logger } from "./utils/logger.js";
import { loadConfig, type AppConfig } from "./config.js";
import { createSearchLocalTool, type SearchLocalResult } from "./tools/searchLocal.js";
import { createGetDocTool } from "./tools/getDoc.js";
import { createReindexTool } from "./tools/reindex.js";
import { createWatchTool } from "./tools/watch.js";
import { createStatsTool } from "./tools/stats.js";
import { createImportChatGPTTool } from "./tools/importChatGPT.js";
import { createMcpServer } from "./createMcpServer.js";

interface HttpEvent {
  type: string;
  timestamp: number;
  message?: string;
  detail?: Record<string, unknown>;
}

class EventHub extends EventEmitter {
  private history: HttpEvent[] = [];
  private maxHistory = 200;

  publish(event: Omit<HttpEvent, "timestamp">) {
    const payload: HttpEvent = {
      ...event,
      timestamp: Date.now(),
    };
    this.history.push(payload);
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(-this.maxHistory);
    }
    this.emit("event", payload);
  }

  replay(res: Response) {
    for (const entry of this.history) {
      res.write(`data: ${JSON.stringify(entry)}\n\n`);
    }
  }
}

function createStaticMiddleware(app: ReturnType<typeof express>) {
  const staticRoots: string[] = [];
  const explicit = process.env.MCP_HTTP_STATIC;
  if (explicit) {
    staticRoots.push(path.resolve(explicit));
  } else {
    const publicDir = path.join(process.cwd(), "public");
    const distDir = path.join(process.cwd(), "dist");
    if (fs.existsSync(publicDir)) staticRoots.push(publicDir);
    if (fs.existsSync(distDir)) staticRoots.push(distDir);
  }
  for (const dir of staticRoots) {
    app.use(express.static(dir, { extensions: ["html", "htm"] }));
  }
}

const port = Number(process.env.PORT ?? 3000);
const allowedOrigin = process.env.MCP_HTTP_ORIGIN ?? "*";
const events = new EventHub();

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "16mb" }));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, MCP-Session");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
});

createStaticMiddleware(app);

const config: AppConfig = await loadConfig();
const searchLocal = createSearchLocalTool(config);
const getDoc = createGetDocTool(config);
const reindex = createReindexTool(config);
const statsTool = createStatsTool(config);
const importChatGPT = createImportChatGPTTool(config);
const watchTool = createWatchTool(config, (event) => {
  events.publish({ type: "watch", detail: event as Record<string, unknown> });
});

async function handleToolCall<T>(
  res: Response,
  toolName: string,
  fn: (args: unknown) => Promise<T>,
  args: unknown
) {
  try {
    const result = await fn(args);
    return result;
  } catch (err) {
    const status = err instanceof ZodError ? 400 : 500;
    const message = err instanceof ZodError ? err.errors.map((e) => e.message).join("; ") : (err as Error).message;
    logger.warn("http-tool-error", { tool: toolName, err: message });
    events.publish({ type: "error", message: `${toolName}: ${message}` });
    res.status(status).json({ error: message });
    return null;
  }
}

app.get("/api/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  const flush = (res as Response & { flushHeaders?: () => void }).flushHeaders;
  if (typeof flush === "function") {
    flush.call(res);
  }
  events.replay(res);
  const listener = (event: HttpEvent) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };
  events.on("event", listener);
  req.on("close", () => {
    events.off("event", listener);
  });
});

app.get("/api/stats", async (_req, res) => {
  const result = await handleToolCall(res, "stats", () => statsTool(), {});
  if (!result) return;
  events.publish({ type: "stats", message: "Stats refreshed" });
  res.json(result);
});

app.post("/api/search", async (req, res) => {
  const result = await handleToolCall(res, "search_local", searchLocal, req.body ?? {});
  if (!result) return;
  const typed = result as SearchLocalResult;
  events.publish({
    type: "search",
    message: `Search for "${typed.query}" returned ${typed.results.length} result(s)`,
    detail: { query: typed.query, results: typed.results.length },
  });
  res.json(result);
});

app.post("/api/get-doc", async (req, res) => {
  const result = await handleToolCall(res, "get_doc", getDoc, req.body ?? {});
  if (!result) return;
  events.publish({
    type: "document",
    message: `Fetched document ${(result as { path?: string }).path ?? "unknown"}`,
  });
  res.json(result);
});

app.post("/api/reindex", async (req, res) => {
  const result = await handleToolCall(res, "reindex", reindex, req.body ?? {});
  if (!result) return;
  events.publish({ type: "reindex", message: "Reindex complete", detail: result as Record<string, unknown> });
  res.json(result);
});

app.post("/api/watch", async (req, res) => {
  const result = await handleToolCall(res, "watch", watchTool, req.body ?? {});
  if (!result) return;
  events.publish({ type: "watch", message: "Watch started", detail: result as Record<string, unknown> });
  res.json(result);
});

app.post("/api/import-chatgpt", async (req, res) => {
  const result = await handleToolCall(res, "import_chatgpt_export", importChatGPT, req.body ?? {});
  if (!result) return;
  events.publish({
    type: "import",
    message: "ChatGPT export imported",
    detail: result as Record<string, unknown>,
  });
  res.json(result);
});

// SSE transport for ChatGPT / MCP clients
const sseTransports = new Map<string, { transport: SSEServerTransport; close: () => Promise<void> }>();

app.get("/mcp", async (req, res) => {
  try {
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    const transport = new SSEServerTransport("/messages", res);
    const sessionId = transport.sessionId;
    const { server } = await createMcpServer();
    sseTransports.set(sessionId, {
      transport,
      close: async () => {
        await server.close();
      },
    });
    transport.onclose = async () => {
      events.publish({ type: "sse", message: `SSE session ${sessionId} closed` });
      sseTransports.delete(sessionId);
      await server.close().catch((err) => {
        logger.warn("sse-close-error", { err: String(err) });
      });
    };
    await server.connect(transport);
    events.publish({ type: "sse", message: `SSE session ${sessionId} opened` });
  } catch (err) {
    logger.error("sse-connect-error", { err: String(err) });
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to establish SSE session" });
    }
  }
});

app.post("/messages", async (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string | undefined;
  if (!sessionId) {
    res.status(400).json({ error: "Missing sessionId" });
    return;
  }
  const entry = sseTransports.get(sessionId);
  if (!entry) {
    res.status(404).json({ error: "Unknown session" });
    return;
  }
  try {
    await entry.transport.handlePostMessage(req, res, req.body);
  } catch (err) {
    logger.error("sse-message-error", { err: String(err) });
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to process message" });
    }
  }
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const server = app.listen(port, () => {
  const address = server.address() as AddressInfo | null;
  const actualPort = address?.port ?? port;
  logger.info("http-listening", { port: actualPort, origin: allowedOrigin });
  events.publish({ type: "startup", message: `HTTP server listening on port ${actualPort}` });
});

process.on("SIGTERM", async () => {
  logger.info("http-shutdown", {});
  server.close();
  await Promise.all(
    Array.from(sseTransports.values()).map(async ({ transport, close }) => {
      try {
        await transport.close();
      } catch (err) {
        logger.warn("sse-transport-close-error", { err: String(err) });
      }
      try {
        await close();
      } catch (err) {
        logger.warn("sse-server-close-error", { err: String(err) });
      }
    })
  );
});
