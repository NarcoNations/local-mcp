import fs from "node:fs/promises";
import path from "node:path";
import Fastify from "fastify";
import helmet from "@fastify/helmet";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { importPaths } from "./services/import-service.js";
import { indexPendingDocuments } from "./services/index-service.js";
import { searchCorpus } from "./services/search-service.js";
import { registerMcpTools } from "./mcp/toolkit.js";
import { db } from "./db/index.js";
import { sql } from "drizzle-orm";

const SERVER_INFO = {
  name: "mcp-memory-server",
  version: "0.2.0",
};

const ingestSchema = z.object({
  paths: z.array(z.string().min(1)).nonempty().optional(),
  url: z.string().url().optional(),
  base64: z.string().optional(),
});

const searchSchema = z.object({
  query: z.string().min(1),
  top_k: z.number().int().positive().max(32).optional(),
  filters: z
    .object({
      author: z.string().optional(),
      content_type: z.string().optional(),
      slug: z.string().optional(),
      tag: z.string().optional(),
      date_from: z.string().optional(),
      date_to: z.string().optional(),
    })
    .optional(),
});

const fastifyLogger = logger.child({ service: "http" });

const app = Fastify({
  trustProxy: true,
  logger: fastifyLogger,
});

await app.register(helmet, { contentSecurityPolicy: false });
await app.register(cors, { origin: true });
await app.register(rateLimit, {
  max: env.RATE_LIMIT_MAX,
  timeWindow: env.RATE_LIMIT_WINDOW,
});

function shouldSkipAuth(request: FastifyRequest) {
  const url = request.url;
  if (!env.API_KEY) return true;
  if (
    url === "/mcp.json" ||
    url === "/health" ||
    url.startsWith("/mcp/sse") ||
    url.startsWith("/mcp/messages")
  ) {
    return true;
  }
  return false;
}

app.addHook("onRequest", async (request, reply) => {
  if (shouldSkipAuth(request)) return;
  const auth = request.headers["authorization"];
  if (!auth || auth !== `Bearer ${env.API_KEY}`) {
    reply.code(401).send({ ok: false, error: "Unauthorized" });
  }
});

app.post("/ingest", async (request, reply) => {
  const parsed = ingestSchema.safeParse(request.body);
  if (!parsed.success) {
    reply.code(400).send({ ok: false, error: parsed.error.message });
    return;
  }
  const { paths, url, base64 } = parsed.data;
  if (!paths?.length) {
    reply.code(400).send({ ok: false, error: "paths[] is required" });
    return;
  }
  if (url || base64) {
    reply.code(501).send({ ok: false, error: "url/base64 ingestion not implemented" });
    return;
  }
  const importSummary = await importPaths(paths);
  const indexSummary = await indexPendingDocuments();
  reply.send({ ok: true, import: importSummary, index: indexSummary });
});

app.post("/search", async (request, reply) => {
  const parsed = searchSchema.safeParse(request.body);
  if (!parsed.success) {
    reply.code(400).send({ ok: false, error: parsed.error.message });
    return;
  }
  const filters = parsed.data.filters
    ? {
        author: parsed.data.filters.author,
        contentType: parsed.data.filters.content_type,
        slug: parsed.data.filters.slug,
        tag: parsed.data.filters.tag,
        dateFrom: parsed.data.filters.date_from ? new Date(parsed.data.filters.date_from) : undefined,
        dateTo: parsed.data.filters.date_to ? new Date(parsed.data.filters.date_to) : undefined,
      }
    : {};
  const result = await searchCorpus(parsed.data.query, parsed.data.top_k ?? env.RESULTS_TOPK, filters);
  reply.send({ ok: true, data: result });
});

app.get("/health", async (_request, reply) => {
  let dbStatus: "up" | "down" = "up";
  try {
    await db.execute(sql`SELECT 1`);
  } catch (error) {
    dbStatus = "down";
  }
  const embedStatus = env.EMBED_PROVIDER === "local"
    ? "local"
    : env.API_KEY
    ? "remote"
    : "degraded";
  reply.send({ ok: dbStatus === "up", db: dbStatus, embedder: embedStatus });
});

app.get("/mcp.json", async (_request, reply) => {
  const manifestPath = path.resolve(process.cwd(), "mcp.json");
  try {
    const data = await fs.readFile(manifestPath, "utf8");
    reply.type("application/json").send(data);
  } catch (error) {
    reply.code(500).send({ ok: false, error: "Manifest not found" });
  }
});

// --- MCP SSE bridge ---

interface SessionState {
  server: McpServer;
  transport: SSEServerTransport;
}

const sessions = new Map<string, SessionState>();

function getSessionId(request: FastifyRequest): string | undefined {
  const sessionId = request.headers["mcp-session-id"];
  if (typeof sessionId === "string") return sessionId;
  const queryId = (request.query as Record<string, string | undefined>)?.sessionId;
  return queryId;
}

async function startSseSession(request: FastifyRequest, reply: FastifyReply, messagePath: string) {
  reply.hijack();
  const res = reply.raw;
  const transport = new SSEServerTransport(messagePath, res, {
    enableDnsRebindingProtection: env.NODE_ENV === "production",
  });

  const sessionServer = new McpServer(SERVER_INFO, {
    capabilities: { tools: {}, logging: {} },
    instructions:
      "Use search_corpus for hybrid retrieval, add_documents for ingestion, get_document for metadata, list_sources for provenance, and link_items to connect findings.",
  });
  registerMcpTools(sessionServer);

  sessions.set(transport.sessionId, { server: sessionServer, transport });

  transport.onclose = () => {
    sessions.delete(transport.sessionId);
    sessionServer
      .close()
      .catch(() => {
        /* noop */
      });
  };

  transport.onerror = (error) => {
    logger.error("sse-transport-error", {
      sessionId: transport.sessionId,
      error: error instanceof Error ? error.message : String(error),
    });
  };

  try {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    });
    await sessionServer.connect(transport);
    res.write(": ready\n\n");
  } catch (error) {
    logger.error("sse-connection-failed", { err: error instanceof Error ? error.message : String(error) });
    sessions.delete(transport.sessionId);
    res.writeHead(500);
    res.end();
  }
}

app.get("/mcp/sse", async (request, reply) => {
  await startSseSession(request, reply, "/mcp/messages");
});

app.post("/mcp/messages", async (request, reply) => {
  const sessionId = getSessionId(request);
  if (!sessionId) {
    reply.code(400).send({ ok: false, error: "sessionId required" });
    return;
  }
  const session = sessions.get(sessionId);
  if (!session) {
    reply.code(404).send({ ok: false, error: "Unknown session" });
    return;
  }
  try {
    await session.transport.handlePostMessage(request.raw, reply.raw, request.body);
  } catch (error) {
    logger.error("sse-post-failed", {
      sessionId,
      err: error instanceof Error ? error.message : String(error),
    });
    if (!reply.raw.headersSent) {
      reply.code(500).send({ ok: false, error: "message failed" });
    }
  }
});

app.delete("/mcp/messages", async (request, reply) => {
  const sessionId = getSessionId(request);
  if (!sessionId) {
    reply.code(400).send({ ok: false, error: "sessionId required" });
    return;
  }
  const session = sessions.get(sessionId);
  if (!session) {
    reply.code(404).send({ ok: false, error: "Unknown session" });
    return;
  }
  sessions.delete(sessionId);
  await session.transport.close().catch(() => {});
  await session.server.close().catch(() => {});
  reply.status(204).send();
});

const port = env.PORT;
const host = env.HOST;

try {
  await app.listen({ port, host });
  logger.info("http-listening", { port, host });
} catch (error) {
  logger.error("http-startup-failed", { err: error instanceof Error ? error.message : String(error) });
  process.exit(1);
}
