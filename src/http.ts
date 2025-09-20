import http, { type IncomingMessage, type ServerResponse } from "node:http";
import https from "node:https";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { URL } from "node:url";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createMcpServerBundle, SERVER_INFO, type McpServerBundle } from "./createMcpServer.js";
import { logger, subscribeToLogs, type LogRecord } from "./utils/logger.js";

const PORT = Number(process.env.PORT ?? 3040);
const HOST = process.env.HOST ?? "0.0.0.0";
const MESSAGE_ENDPOINT = process.env.MCP_MESSAGE_PATH ?? "/mcp/messages";
const STREAM_ENDPOINT = process.env.MCP_STREAM_PATH ?? "/mcp/stream";
const LOG_STREAM_ENDPOINT = process.env.LOG_STREAM_PATH ?? "/logs/stream";
const API_PREFIX = process.env.API_PREFIX ?? "/api";
const MAX_BODY_SIZE = 4 * 1024 * 1024; // 4MB, aligned with MCP message limit.
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "*";

const DEFAULT_CERT = path.join(process.cwd(), "dev-cert.pem");
const DEFAULT_KEY = path.join(process.cwd(), "dev-key.pem");
const CERT_PATH = process.env.TLS_CERT_PATH ?? DEFAULT_CERT;
const KEY_PATH = process.env.TLS_KEY_PATH ?? DEFAULT_KEY;
const FORCE_HTTP = process.env.HTTP_ONLY === "1";

interface SessionContext {
  transport: SSEServerTransport;
  bundle: McpServerBundle;
  dispose: () => Promise<void>;
}

class LogStream {
  private listeners = new Set<(record: LogRecord) => void>();
  private history: LogRecord[] = [];
  constructor(private readonly maxItems = 200) {}

  push(record: LogRecord): void {
    this.history.push(record);
    if (this.history.length > this.maxItems) {
      this.history.shift();
    }
    for (const listener of this.listeners) {
      listener(record);
    }
  }

  subscribe(listener: (record: LogRecord) => void): () => void {
    this.listeners.add(listener);
    for (const item of this.history) {
      listener(item);
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  snapshot(): LogRecord[] {
    return [...this.history];
  }
}

const logStream = new LogStream();
subscribeToLogs((record) => logStream.push(record));

const sessions = new Map<string, SessionContext>();
let cachedBundlePromise: Promise<McpServerBundle> | null = null;

function setCorsHeaders(res: ServerResponse): void {
  res.setHeader("Access-Control-Allow-Origin", CORS_ORIGIN);
  res.setHeader("Access-Control-Allow-Headers", "content-type, mcp-session-id");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
}

async function readRequestBody(req: IncomingMessage): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_SIZE) {
        reject(new Error("Payload too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf8"));
    });
    req.on("error", reject);
  });
}

async function parseJsonBody<T>(req: IncomingMessage): Promise<T> {
  const raw = await readRequestBody(req);
  if (!raw.trim()) {
    return {} as T;
  }
  return JSON.parse(raw) as T;
}

function resolveStaticDirectory(): string {
  const overrides = [process.env.STATIC_DIR];
  const candidates = [
    ...overrides.filter((dir): dir is string => Boolean(dir)),
    path.join(process.cwd(), "dist"),
    path.join(process.cwd(), "public"),
  ];
  for (const candidate of candidates) {
    try {
      const stat = fs.statSync(candidate);
      if (!stat.isDirectory()) continue;
      const indexPath = path.join(candidate, "index.html");
      if (fs.existsSync(indexPath)) {
        return candidate;
      }
    } catch {
      continue;
    }
  }
  return path.join(process.cwd(), "public");
}

const STATIC_DIR = resolveStaticDirectory();

const MIME_TYPES: Record<string, string> = {
  html: "text/html; charset=utf-8",
  css: "text/css; charset=utf-8",
  js: "application/javascript; charset=utf-8",
  json: "application/json; charset=utf-8",
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  ico: "image/x-icon",
  webmanifest: "application/manifest+json",
};

async function serveStatic(req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> {
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";
  const safePath = path.normalize(path.join(STATIC_DIR, pathname));
  if (!safePath.startsWith(STATIC_DIR)) {
    res.writeHead(404).end("Not found");
    return;
  }
  let target = safePath;
  try {
    const stat = await fsp.stat(target);
    if (stat.isDirectory()) {
      target = path.join(target, "index.html");
    }
  } catch {
    res.writeHead(404).end("Not found");
    return;
  }
  try {
    const data = await fsp.readFile(target);
    const ext = path.extname(target).replace(".", "").toLowerCase();
    const type = MIME_TYPES[ext] ?? "application/octet-stream";
    res.writeHead(200, { "Content-Type": type });
    res.end(data);
  } catch (err) {
    logger.error("static-error", { err: String(err), file: target });
    res.writeHead(500).end("Unable to read asset");
  }
}

async function handleManifest(res: ServerResponse): Promise<void> {
  const manifestPath = path.join(process.cwd(), "mcp.json");
  try {
    const data = await fsp.readFile(manifestPath, "utf8");
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(data);
  } catch (err) {
    logger.error("manifest-error", { err: String(err) });
    res.writeHead(404).end("Manifest not found");
  }
}

async function getHttpBundle(): Promise<McpServerBundle> {
  if (!cachedBundlePromise) {
    cachedBundlePromise = createMcpServerBundle();
  }
  return await cachedBundlePromise;
}

async function handleApiRequest(req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> {
  setCorsHeaders(res);
  if (req.method === "OPTIONS") {
    res.writeHead(204).end();
    return;
  }

  const bundle = await getHttpBundle();
  const pathSuffix = url.pathname.slice(API_PREFIX.length);
  try {
    if (req.method === "GET" && pathSuffix === "/stats") {
      const stats = await bundle.tools.stats();
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(stats));
      return;
    }
    if (req.method === "GET" && pathSuffix === "/roots") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ roots: bundle.config.roots.roots }));
      return;
    }
    if (req.method === "GET" && pathSuffix === "/info") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ server: SERVER_INFO }));
      return;
    }
    if (req.method === "GET" && pathSuffix === "/logs") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ entries: logStream.snapshot() }));
      return;
    }
    if (req.method === "POST") {
      switch (pathSuffix) {
        case "/search": {
          const body = await parseJsonBody<Record<string, unknown>>(req);
          const result = await bundle.tools.searchLocal(body);
          res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify(result));
          return;
        }
        case "/get-doc": {
          const body = await parseJsonBody<Record<string, unknown>>(req);
          const doc = await bundle.tools.getDoc(body);
          res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify(doc));
          return;
        }
        case "/reindex": {
          const body = await parseJsonBody<Record<string, unknown>>(req);
          const stats = await bundle.tools.reindex(body);
          res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify(stats));
          return;
        }
        case "/watch": {
          const body = await parseJsonBody<Record<string, unknown>>(req);
          const info = await bundle.tools.watch(body);
          res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify(info));
          return;
        }
        case "/import-chatgpt": {
          const body = await parseJsonBody<Record<string, unknown>>(req);
          const result = await bundle.tools.importChatGPT(body);
          res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify(result));
          return;
        }
        default:
          res.writeHead(404).end("API endpoint not found");
          return;
      }
    }

    res.writeHead(405).end("Method not allowed");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn("api-error", { path: pathSuffix, err: message });
    res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: message }));
  }
}

async function handleLogStream(_req: IncomingMessage, res: ServerResponse): Promise<void> {
  setCorsHeaders(res);
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    Connection: "keep-alive",
    "Cache-Control": "no-cache, no-transform",
    "X-Accel-Buffering": "no",
  });
  const send = (record: LogRecord) => {
    res.write(`event: log\ndata: ${JSON.stringify(record)}\n\n`);
  };
  const unsubscribe = logStream.subscribe(send);
  const keepAlive = setInterval(() => {
    res.write(":keep-alive\n\n");
  }, 25000);
  res.on("close", () => {
    clearInterval(keepAlive);
    unsubscribe();
  });
}

async function handleSseStream(req: IncomingMessage, res: ServerResponse): Promise<void> {
  setCorsHeaders(res);
  res.setHeader("X-Accel-Buffering", "no");
  const bundle = await createMcpServerBundle();
  const transport = new SSEServerTransport(MESSAGE_ENDPOINT, res);
  const sessionId = transport.sessionId;

  const session: SessionContext = {
    transport,
    bundle,
    dispose: async () => {
      sessions.delete(sessionId);
      try {
        await bundle.tools.watch.stop();
      } catch (err) {
        logger.debug("watch-stop-failed", { err: String(err) });
      }
      try {
        await bundle.server.close();
      } catch (err) {
        logger.debug("server-close-failed", { err: String(err) });
      }
    },
  };

  transport.onclose = () => {
    session
      .dispose()
      .catch((err) => logger.warn("sse-dispose-error", { err: String(err), sessionId }));
  };
  transport.onerror = (error) => {
    logger.warn("sse-transport-error", { err: String(error), sessionId });
  };

  sessions.set(sessionId, session);

  try {
    await bundle.server.connect(transport);
    logger.info("sse-session-started", { sessionId });
  } catch (err) {
    await session.dispose();
    logger.error("sse-session-failed", { err: String(err) });
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: "Failed to establish SSE session" }));
    }
  }
}

async function handleSseMessage(req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> {
  setCorsHeaders(res);
  const sessionId = url.searchParams.get("sessionId") ?? req.headers["mcp-session-id"]?.toString();
  if (!sessionId) {
    res.writeHead(400).end("Missing sessionId");
    return;
  }
  const session = sessions.get(sessionId);
  if (!session) {
    res.writeHead(404).end("Unknown session");
    return;
  }
  try {
    await session.transport.handlePostMessage(req, res);
  } catch (err) {
    logger.warn("sse-post-error", { err: String(err), sessionId });
    if (!res.headersSent) {
      res.writeHead(500).end("Failed to process message");
    }
  }
}

function createServer(handler: (req: IncomingMessage, res: ServerResponse) => void): http.Server | https.Server {
  if (FORCE_HTTP) {
    return http.createServer(handler);
  }
  try {
    const key = fs.readFileSync(KEY_PATH);
    const cert = fs.readFileSync(CERT_PATH);
    return https.createServer({ key, cert }, handler);
  } catch (err) {
    logger.warn("https-disabled", { err: String(err) });
    return http.createServer(handler);
  }
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  if (req.method === "OPTIONS" && (url.pathname.startsWith(API_PREFIX) || url.pathname === MESSAGE_ENDPOINT)) {
    setCorsHeaders(res);
    res.writeHead(204).end();
    return;
  }

  if (url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (url.pathname === "/mcp.json" && req.method === "GET") {
    void handleManifest(res);
    return;
  }

  if (url.pathname === STREAM_ENDPOINT && req.method === "GET") {
    void handleSseStream(req, res);
    return;
  }

  if (url.pathname === MESSAGE_ENDPOINT && req.method === "POST") {
    void handleSseMessage(req, res, url);
    return;
  }

  if (url.pathname === LOG_STREAM_ENDPOINT && req.method === "GET") {
    void handleLogStream(req, res);
    return;
  }

  if (url.pathname.startsWith(API_PREFIX)) {
    void handleApiRequest(req, res, url);
    return;
  }

  void serveStatic(req, res, url);
});

server.listen(PORT, HOST, () => {
  const address = server.address();
  const actualPort = typeof address === "object" && address ? address.port : PORT;
  logger.info("http-listening", {
    port: actualPort,
    host: HOST,
    https: server instanceof https.Server,
    streamEndpoint: STREAM_ENDPOINT,
    messageEndpoint: MESSAGE_ENDPOINT,
    apiPrefix: API_PREFIX,
  });
});
