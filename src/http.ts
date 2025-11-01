import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import express, { Request, Response } from "express";
import cors from "cors";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { loadConfig } from "./config.js";
import { logger } from "./utils/logger.js";
import { createToolKit, registerMcpTools } from "./mcp/toolkit.js";
import { ZodError } from "zod";
import {
  MemoryCache,
  SupabaseCache,
  routeFeed,
  FeedRequestSchema,
  ProviderError,
  LLMRunSchema,
  runLLM,
} from "../packages/api-manager/src/index.js";
import type { CacheClient, FeedRequest, FeedResult, ProviderId, LLMRun } from "../packages/api-manager/src/types.js";
import { recordHistorianEvent } from "./utils/historian.js";

const SERVER_INFO = {
  name: "mcp-nn",
  version: "1.1.0",
};

interface LogEntry {
  id: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  details?: Record<string, unknown> | undefined;
  time: string;
}

interface SessionState {
  transport: SSEServerTransport;
  server: McpServer;
}

const sessions = new Map<string, SessionState>();
const logSubscribers = new Set<Response>();
const logs: LogEntry[] = [];
const MAX_LOGS = 250;

class HybridCache implements CacheClient {
  constructor(private readonly memory = new MemoryCache({ maxEntries: 500 }), private readonly remote?: SupabaseCache | null) {}

  async get<T>(key: string): Promise<T | null> {
    const fromMemory = this.memory.get<T>(key);
    if (fromMemory) return fromMemory;
    if (!this.remote) return null;
    const remoteValue = await this.remote.get<T>(key);
    if (remoteValue) {
      this.memory.set(key, remoteValue, 60);
      return remoteValue;
    }
    return null;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    this.memory.set(key, value, ttlSeconds);
    if (this.remote) {
      await this.remote.set(key, value, ttlSeconds);
    }
  }
}

function pushLog(level: LogEntry["level"], message: string, details?: Record<string, unknown>) {
  const entry: LogEntry = {
    id: randomUUID(),
    level,
    message,
    details,
    time: new Date().toISOString(),
  };
  logs.push(entry);
  if (logs.length > MAX_LOGS) {
    logs.splice(0, logs.length - MAX_LOGS);
  }
  for (const res of logSubscribers) {
    try {
      res.write(`data: ${JSON.stringify(entry)}\n\n`);
    } catch {
      logSubscribers.delete(res);
    }
  }
}

  function parseList(env?: string): string[] | undefined {
    if (!env) return undefined;
    const parts = env
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    return parts.length ? parts : undefined;
  }

  function normaliseProviderId(value: string): ProviderId {
    const map: Record<string, ProviderId> = {
      alpha: "alpha",
      alphavantage: "alpha",
      finnhub: "finnhub",
      tiingo: "tiingo",
      polygon: "polygon",
    };
    const key = value.toLowerCase();
    return map[key] ?? (key as ProviderId);
  }

  function parseFeedRequest(req: Request): FeedRequest {
    const providerParam = typeof req.params.provider === "string" ? req.params.provider : "";
    const provider = normaliseProviderId(providerParam);
    const rawResource = typeof req.query.resource === "string" ? req.query.resource : undefined;
    const fn = typeof req.query.fn === "string" ? req.query.fn : undefined;
    const symbol = typeof req.query.symbol === "string" ? req.query.symbol : "";
    const interval = typeof req.query.interval === "string" ? req.query.interval : undefined;
    const range = typeof req.query.range === "string" ? req.query.range : undefined;
    const resourceMap: Record<string, string> = {
      quote: "quote",
      overview: "company",
      company: "company",
      timeseries: "timeseries",
      "time_series_daily": "timeseries",
    };
    const fallback = fn ? resourceMap[fn.toLowerCase()] : undefined;
    const resource = rawResource ?? fallback ?? "quote";
    const forceRefresh = req.query.force === "1" || req.query.force === "true" || req.query.refresh === "true";
    return FeedRequestSchema.parse({ provider, resource, symbol, interval, range, forceRefresh });
  }

function resolveStaticDir(): { root: string; index: string } | null {
  const candidates = [
    path.resolve(process.cwd(), "dist/public"),
    path.resolve(process.cwd(), "dist"),
    path.resolve(process.cwd(), "public"),
  ];
  for (const dir of candidates) {
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) continue;
    const indexPath = path.join(dir, "index.html");
    if (fs.existsSync(indexPath)) {
      return { root: dir, index: indexPath };
    }
  }
  return null;
}

function getSessionId(req: Request): string | undefined {
  const queryId = typeof req.query.sessionId === "string" ? req.query.sessionId : undefined;
  const headerId = req.headers["mcp-session-id"];
  if (typeof headerId === "string") return headerId;
  if (Array.isArray(headerId)) return headerId[0];
  return queryId;
}

  async function main() {
    const config = await loadConfig();
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;
    const remoteCache = supabaseUrl && supabaseKey ? new SupabaseCache(supabaseUrl, supabaseKey) : null;
    const feedCache = new HybridCache(new MemoryCache({ maxEntries: 600 }), remoteCache);
    const httpToolkit = createToolKit(config, {
      onWatchEvent: (event) => {
        pushLog("info", "watch-event", event as Record<string, unknown>);
      },
    });

  const app = express();
  app.use(
    cors({
      origin: process.env.MCP_ALLOW_ORIGINS ? parseList(process.env.MCP_ALLOW_ORIGINS) : true,
      exposedHeaders: ["Mcp-Session-Id"],
      allowedHeaders: ["Content-Type", "mcp-session-id"],
    })
  );
  app.use(express.json({ limit: "6mb" }));

  const dnsProtectionEnabled = process.env.MCP_ENABLE_DNS_REBINDING === "1";
  const allowedHosts = parseList(process.env.MCP_ALLOWED_HOSTS);
  const allowedOrigins = parseList(process.env.MCP_ALLOWED_ORIGINS);

  app.get("/mcp/sse", async (req, res) => {
    let transport: SSEServerTransport | null = null;
    try {
      const sessionServer = new McpServer(SERVER_INFO, {
        capabilities: { tools: {}, logging: {} },
        instructions:
          "Local research MCP server. Use search_local for retrieval, get_doc for source text, reindex/watch to refresh, stats for corpus metrics, and import_chatgpt_export to convert ChatGPT exports.",
      });
      const toolkit = createToolKit(config, {
        server: sessionServer,
        onWatchEvent: (event) => pushLog("info", "watch-event", event as Record<string, unknown>),
      });
      registerMcpTools(sessionServer, toolkit);

      transport = new SSEServerTransport("/mcp/messages", res, {
        enableDnsRebindingProtection: dnsProtectionEnabled,
        allowedHosts,
        allowedOrigins,
      });
      sessions.set(transport.sessionId, { server: sessionServer, transport });

      transport.onclose = () => {
        sessions.delete(transport!.sessionId);
        pushLog("info", "sse-session-closed", { sessionId: transport!.sessionId });
        sessionServer.close().catch(() => {});
      };
      transport.onerror = (error) => {
        pushLog("error", "sse-transport-error", {
          sessionId: transport!.sessionId,
          error: error instanceof Error ? error.message : String(error),
        });
      };

      await sessionServer.connect(transport);
      pushLog("info", "sse-session-started", { sessionId: transport.sessionId, remote: req.ip ?? undefined });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error("sse-connection-failed", { err: message });
      pushLog("error", "sse-connection-failed", { error: message });
      if (transport) {
        sessions.delete(transport.sessionId);
      }
      if (!res.headersSent) {
        res.status(500).json({ ok: false, error: message });
      }
    }
  });

  app.post("/mcp/messages", async (req, res) => {
    const sessionId = getSessionId(req);
    if (!sessionId) {
      res.status(400).json({ ok: false, error: "sessionId required" });
      return;
    }
    const session = sessions.get(sessionId);
    if (!session) {
      res.status(404).json({ ok: false, error: "Unknown session" });
      return;
    }
    try {
      await session.transport.handlePostMessage(req, res, req.body);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.warn("sse-post-failed", { sessionId, err: message });
      pushLog("error", "sse-post-failed", { sessionId, error: message });
      if (!res.headersSent) {
        res.status(500).json({ ok: false, error: message });
      }
    }
  });

  app.delete("/mcp/messages", async (req, res) => {
    const sessionId = getSessionId(req);
    if (!sessionId) {
      res.status(400).json({ ok: false, error: "sessionId required" });
      return;
    }
    const session = sessions.get(sessionId);
    if (!session) {
      res.status(404).json({ ok: false, error: "Unknown session" });
      return;
    }
    sessions.delete(sessionId);
    await session.transport.close().catch(() => {});
    await session.server.close().catch(() => {});
    pushLog("info", "sse-session-closed", { sessionId });
    res.status(204).end();
  });

  async function respond<T>(
    res: Response,
    operation: () => Promise<T>,
    context: {
      success?: string;
      error?: string;
      meta?: Record<string, unknown>;
      onSuccess?: (data: T) => void | Promise<void>;
      onError?: (error: unknown) => void | Promise<void>;
    }
  ) {
    try {
      const data = await operation();
      if (context.success) {
        pushLog("info", context.success, context.meta);
      }
      await context.onSuccess?.(data);
      res.json({ ok: true, data });
    } catch (error) {
      const isValidation = error instanceof ZodError;
      const isProvider = error instanceof ProviderError;
      const message = error instanceof Error ? error.message : String(error);
      const meta = { ...(context.meta ?? {}), error: message };
      pushLog("error", context.error ?? "api-error", meta);
      await context.onError?.(error);
      const status = isValidation ? 400 : isProvider && error.status ? error.status : 500;
      res.status(status).json({ ok: false, error: message });
    }
  }

  app.post("/api/search", async (req, res) => {
    await respond(
      res,
      () => httpToolkit.searchLocal(req.body),
      {
        success: "search-completed",
        error: "search-failed",
        meta: { query: req.body?.query },
      }
    );
  });

  app.post("/api/doc", async (req, res) => {
    await respond(
      res,
      () => httpToolkit.getDoc(req.body),
      {
        success: "doc-loaded",
        error: "doc-failed",
        meta: { path: req.body?.path, page: req.body?.page },
      }
    );
  });

  app.get("/api/stats", async (_req, res) => {
    await respond(res, () => httpToolkit.stats(), {
      success: "stats-loaded",
      error: "stats-failed",
    });
  });

  app.post("/api/reindex", async (req, res) => {
    await respond(
      res,
      () => httpToolkit.reindex(req.body ?? {}),
      {
        success: "reindex-completed",
        error: "reindex-failed",
        meta: { paths: req.body?.paths },
      }
    );
  });

  app.post("/api/watch", async (req, res) => {
    await respond(
      res,
      () => httpToolkit.watch(req.body ?? {}, { sessionId: "http" }),
      {
        success: "watch-started",
        error: "watch-failed",
        meta: { paths: req.body?.paths },
      }
    );
  });

  app.post("/api/import", async (req, res) => {
    await respond(
      res,
      () => httpToolkit.importChatGPT(req.body),
      {
        success: "import-completed",
        error: "import-failed",
        meta: { outDir: req.body?.outDir },
      }
    );
  });

  app.get("/api/feeds/:provider", async (req, res) => {
    let request: FeedRequest;
    try {
      request = parseFeedRequest(req);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(400).json({ ok: false, error: message });
      return;
    }
    const started = Date.now();
    await respond<FeedResult>(
      res,
      () => routeFeed(request, { cache: feedCache }),
      {
        success: "feed-request-success",
        error: "feed-request-failed",
        meta: { provider: request.provider, resource: request.resource, symbol: request.symbol },
        onSuccess: async (result) => {
          await recordHistorianEvent({
            source: "api-manager",
            kind: "api.feed",
            title: `${request.provider}.${request.resource}`,
            status: "ok",
            meta: {
              symbol: request.symbol,
              cached: result.cached,
              latencyMs: Date.now() - started,
            },
          });
        },
        onError: async (error) => {
          await recordHistorianEvent({
            source: "api-manager",
            kind: "api.feed",
            title: `${request.provider}.${request.resource}`,
            status: "error",
            meta: {
              symbol: request.symbol,
              error: error instanceof Error ? error.message : String(error),
            },
          });
        },
      }
    );
  });

  app.get("/api/logs", (_req, res) => {
    res.json({ ok: true, data: logs });
  });

  app.post("/api/llm/run", async (req, res) => {
    let payload: LLMRun;
    try {
      payload = LLMRunSchema.parse(req.body);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(400).json({ ok: false, error: message });
      return;
    }
    const started = Date.now();
    await respond(
      res,
      () => runLLM(payload),
      {
        success: "llm-run-success",
        error: "llm-run-failed",
        meta: { task: payload.task, hint: payload.modelHint ?? null },
        onSuccess: async (result) => {
          await recordHistorianEvent({
            source: "api-manager",
            kind: "api.llm",
            title: `${result.provider}:${result.model}`,
            status: result.error ? "warn" : "ok",
            meta: {
              task: payload.task,
              latencyMs: result.latencyMs,
              costEst: result.costEst,
              hint: payload.modelHint ?? null,
              durationMs: Date.now() - started,
            },
          });
        },
        onError: async (error) => {
          await recordHistorianEvent({
            source: "api-manager",
            kind: "api.llm",
            title: `${payload.task}`,
            status: "error",
            meta: {
              hint: payload.modelHint ?? null,
              error: error instanceof Error ? error.message : String(error),
            },
          });
        },
      }
    );
  });

  app.get("/api/logs/stream", (req, res) => {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    });
    logs.forEach((entry) => {
      res.write(`data: ${JSON.stringify(entry)}\n\n`);
    });
    logSubscribers.add(res);
    req.on("close", () => {
      logSubscribers.delete(res);
    });
  });

  app.get("/health", (_req, res) => {
    res.json({ ok: true, sessions: sessions.size });
  });

  app.get("/mcp.json", (_req, res) => {
    const manifestPath = path.resolve(process.cwd(), "mcp.json");
    res.type("application/json");
    res.sendFile(manifestPath, (error) => {
      if (error) {
        const err = error as NodeJS.ErrnoException & { statusCode?: number };
        res.status(err.statusCode ?? 500).json({ ok: false, error: err.message });
      }
    });
  });

  const staticInfo = resolveStaticDir();
  if (staticInfo) {
    app.use(express.static(staticInfo.root, { index: false, fallthrough: true }));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api") || req.path.startsWith("/mcp")) {
        next();
        return;
      }
      res.sendFile(staticInfo.index);
    });
  }

  const port = Number(process.env.HTTP_PORT ?? process.env.PORT ?? 3030);
  const host = process.env.HOST ?? "0.0.0.0";

  app.listen(port, host, () => {
    logger.info("http-listening", { port, host, staticRoot: staticInfo?.root });
    pushLog("info", "http-listening", { port, host, staticRoot: staticInfo?.root });
  });
}

main().catch((err) => {
  logger.error("http-startup-failed", { err: String(err) });
  pushLog("error", "http-startup-failed", { error: String(err) });
  process.exit(1);
});
