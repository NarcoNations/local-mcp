import http, { IncomingMessage, ServerResponse } from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createRuntime } from "./runtime.js";
import { logger } from "./utils/logger.js";

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "0.0.0.0";
const rootDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(rootDir, "..");
const publicDir = path.join(projectRoot, "public");
const manifestPath = path.join(projectRoot, "mcp.json");

interface TransportEntry {
  transport: SSEServerTransport;
  server: McpServer;
}

const transports = new Map<string, TransportEntry>();

interface EventClient {
  res: ServerResponse;
  heartbeat: NodeJS.Timeout;
  unsubscribe: () => void;
}

const eventClients = new Set<EventClient>();

const runtimePromise = createRuntime();

function setCors(res: ServerResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  if (chunks.length === 0) return {};
  const raw = Buffer.concat(chunks).toString("utf-8");
  if (!raw.trim()) return {};
  return JSON.parse(raw);
}

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

async function serveFile(res: ServerResponse, filePath: string): Promise<void> {
  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const types: Record<string, string> = {
      ".html": "text/html; charset=utf-8",
      ".js": "application/javascript; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".json": "application/json; charset=utf-8",
      ".svg": "image/svg+xml",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".ico": "image/x-icon",
    };
    const contentType = types[ext] ?? "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      res.writeHead(404).end("Not found");
      return;
    }
    logger.error("static-serve-error", { error: error instanceof Error ? error.message : String(error) });
    res.writeHead(500).end("Internal error");
  }
}

function resolveStaticPath(urlPath: string): string | null {
  const safePath = path.normalize(urlPath).replace(/^\/+/, "");
  const target = path.join(publicDir, safePath);
  if (!target.startsWith(publicDir)) return null;
  return target;
}

async function handleEvents(res: ServerResponse, runtime: Awaited<typeof runtimePromise>): Promise<void> {
  setCors(res);
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });
  res.write(": connected\n\n");
  const listener = (event: unknown) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };
  const unsubscribe = runtime.subscribe(listener);
  const heartbeat = setInterval(() => {
    res.write(`event: ping\ndata: ${Date.now()}\n\n`);
  }, 20000);
  const client: EventClient = { res, heartbeat, unsubscribe };
  eventClients.add(client);
  res.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe();
    eventClients.delete(client);
  });
}

async function handleSseHandshake(
  req: IncomingMessage,
  res: ServerResponse,
  runtime: Awaited<typeof runtimePromise>
): Promise<void> {
  setCors(res);
  const transport = new SSEServerTransport("/messages", res);
  const server = runtime.createServer();
  transports.set(transport.sessionId, { transport, server });
  transport.onclose = async () => {
    transports.delete(transport.sessionId);
    runtime.emitLog("info", "sse-disconnected", { sessionId: transport.sessionId });
    try {
      await server.close();
    } catch (error) {
      logger.warn("sse-close-error", { error: error instanceof Error ? error.message : String(error) });
    }
  };
  try {
    await server.connect(transport);
    runtime.emitLog("info", "sse-connection", { sessionId: transport.sessionId });
  } catch (error) {
    transports.delete(transport.sessionId);
    logger.error("sse-connect-error", { error: error instanceof Error ? error.message : String(error) });
    if (!res.headersSent) {
      res.writeHead(500).end("Failed to start SSE session");
    }
  }
}

async function handleSsePost(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL
): Promise<void> {
  setCors(res);
  const sessionId = url.searchParams.get("sessionId");
  if (!sessionId) {
    res.writeHead(400).end("Missing sessionId");
    return;
  }
  const entry = transports.get(sessionId);
  if (!entry) {
    res.writeHead(404).end("Unknown session");
    return;
  }
  await entry.transport.handlePostMessage(req, res);
}

async function main(): Promise<void> {
  const runtime = await runtimePromise;

  const server = http.createServer(async (req, res) => {
    if (!req.url) {
      res.writeHead(400).end("Bad request");
      return;
    }

    if (req.method === "OPTIONS") {
      setCors(res);
      res.writeHead(204).end();
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);

    try {
      if (req.method === "GET" && url.pathname === "/health") {
        setCors(res);
        sendJson(res, 200, { status: "ok" });
        return;
      }

      if (req.method === "GET" && url.pathname === "/api/events") {
        await handleEvents(res, runtime);
        return;
      }

      if (req.method === "GET" && url.pathname === "/mcp") {
        await handleSseHandshake(req, res, runtime);
        return;
      }

      if (req.method === "POST" && url.pathname === "/messages") {
        await handleSsePost(req, res, url);
        return;
      }

      if (req.method === "POST" && url.pathname === "/api/search") {
        setCors(res);
        let body: unknown;
        try {
          body = await readJson(req);
        } catch (error) {
          logger.warn("http-search-parse-error", { error: error instanceof Error ? error.message : String(error) });
          sendJson(res, 400, { error: "Invalid JSON payload" });
          return;
        }
        try {
          const result = await runtime.tools.searchLocal(body);
          sendJson(res, 200, result);
        } catch (error) {
          logger.warn("http-search-error", { error: error instanceof Error ? error.message : String(error) });
          sendJson(res, 400, { error: error instanceof Error ? error.message : String(error) });
        }
        return;
      }

      if (req.method === "POST" && url.pathname === "/api/get-doc") {
        setCors(res);
        let body: unknown;
        try {
          body = await readJson(req);
        } catch (error) {
          logger.warn("http-get-doc-parse-error", { error: error instanceof Error ? error.message : String(error) });
          sendJson(res, 400, { error: "Invalid JSON payload" });
          return;
        }
        try {
          const doc = await runtime.tools.getDoc(body);
          sendJson(res, 200, doc);
        } catch (error) {
          logger.warn("http-get-doc-error", { error: error instanceof Error ? error.message : String(error) });
          sendJson(res, 400, { error: error instanceof Error ? error.message : String(error) });
        }
        return;
      }

      if (req.method === "POST" && url.pathname === "/api/reindex") {
        setCors(res);
        let body: unknown;
        try {
          body = await readJson(req);
        } catch (error) {
          logger.warn("http-reindex-parse-error", { error: error instanceof Error ? error.message : String(error) });
          sendJson(res, 400, { error: "Invalid JSON payload" });
          return;
        }
        try {
          const stats = await runtime.tools.reindex(body, { origin: "http" });
          sendJson(res, 200, stats);
        } catch (error) {
          logger.error("http-reindex-error", { error: error instanceof Error ? error.message : String(error) });
          sendJson(res, 400, { error: error instanceof Error ? error.message : String(error) });
        }
        return;
      }

      if (req.method === "POST" && url.pathname === "/api/watch") {
        setCors(res);
        let body: unknown;
        try {
          body = await readJson(req);
        } catch (error) {
          logger.warn("http-watch-parse-error", { error: error instanceof Error ? error.message : String(error) });
          sendJson(res, 400, { error: "Invalid JSON payload" });
          return;
        }
        try {
          const info = await runtime.tools.watch(body, { origin: "http" });
          sendJson(res, 200, info);
        } catch (error) {
          logger.error("http-watch-error", { error: error instanceof Error ? error.message : String(error) });
          sendJson(res, 400, { error: error instanceof Error ? error.message : String(error) });
        }
        return;
      }

      if (req.method === "GET" && url.pathname === "/api/stats") {
        setCors(res);
        try {
          const stats = await runtime.tools.stats();
          sendJson(res, 200, stats);
        } catch (error) {
          logger.error("http-stats-error", { error: error instanceof Error ? error.message : String(error) });
          sendJson(res, 500, { error: error instanceof Error ? error.message : String(error) });
        }
        return;
      }

      if (req.method === "POST" && url.pathname === "/api/import-chatgpt") {
        setCors(res);
        let body: unknown;
        try {
          body = await readJson(req);
        } catch (error) {
          logger.warn("http-import-parse-error", { error: error instanceof Error ? error.message : String(error) });
          sendJson(res, 400, { error: "Invalid JSON payload" });
          return;
        }
        try {
          const result = await runtime.tools.importChatGPT(body, { origin: "http" });
          sendJson(res, 200, result);
        } catch (error) {
          logger.error("http-import-error", { error: error instanceof Error ? error.message : String(error) });
          sendJson(res, 400, { error: error instanceof Error ? error.message : String(error) });
        }
        return;
      }

      if (req.method === "GET" && url.pathname === "/mcp.json") {
        await serveFile(res, manifestPath);
        return;
      }

      if (req.method === "GET" && url.pathname.startsWith("/docs/")) {
        const docPath = path.join(projectRoot, url.pathname);
        await serveFile(res, docPath);
        return;
      }

      if (req.method === "GET") {
        const requested = url.pathname === "/" ? "/index.html" : url.pathname;
        const resolved = resolveStaticPath(requested);
        if (resolved) {
          await serveFile(res, resolved);
          return;
        }
      }

      res.writeHead(404).end("Not found");
    } catch (error) {
      logger.error("http-handler-error", { error: error instanceof Error ? error.message : String(error) });
      if (!res.headersSent) {
        res.writeHead(500).end("Internal server error");
      } else {
        res.end();
      }
    }
  });

  server.listen(port, host, () => {
    logger.info("http-listening", { port, host });
  });

  const shutdown = async () => {
    logger.info("http-shutdown", {});
    for (const client of eventClients) {
      client.unsubscribe();
      clearInterval(client.heartbeat);
      client.res.end();
    }
    for (const [sessionId, entry] of transports) {
      transports.delete(sessionId);
      await entry.transport.close().catch(() => {});
      await entry.server.close().catch(() => {});
    }
    server.close(() => process.exit(0));
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  logger.error("http-startup-error", { error: error instanceof Error ? error.message : String(error) });
  process.exit(1);
});
