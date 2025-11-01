import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import express, { Request, Response } from "express";
import cors from "cors";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { ZodError } from "zod";
import { loadConfig } from "../config.js";
import { logger } from "../utils/logger.js";
import { createToolKit, registerMcpTools } from "../mcp/toolkit.js";

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

export interface CreateHttpAppOptions {
  /**
   * Disable express static fallback. Vercel serves static assets directly so we avoid double handling.
   */
  disableStatic?: boolean;
}

export interface HttpAppInstance {
  app: express.Express;
  logs: LogEntry[];
  pushLog: (level: LogEntry["level"], message: string, details?: Record<string, unknown>) => void;
  sessions: Map<string, SessionState>;
  staticInfo: { root: string; index: string } | null;
  dispose: () => Promise<void>;
}

function parseList(env?: string): string[] | undefined {
  if (!env) return undefined;
  const parts = env
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return parts.length ? parts : undefined;
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

export async function createHttpApp(options: CreateHttpAppOptions = {}): Promise<HttpAppInstance> {
  const sessions = new Map<string, SessionState>();
  const logSubscribers = new Set<Response>();
  const logs: LogEntry[] = [];

  function pushLog(level: LogEntry["level"], message: string, details?: Record<string, unknown>) {
    const entry: LogEntry = {
      id: randomUUID(),
      level,
      message,
      details,
      time: new Date().toISOString(),
    };
    logs.push(entry);
    if (logs.length > 250) {
      logs.splice(0, logs.length - 250);
    }
    for (const res of logSubscribers) {
      try {
        res.write(`data: ${JSON.stringify(entry)}\n\n`);
      } catch (error) {
        logger.warn("log-stream-write-failed", {
          err: error instanceof Error ? error.message : String(error),
        });
        logSubscribers.delete(res);
      }
    }
  }

  const config = await loadConfig();
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
    req.setTimeout?.(0);
    req.socket?.setKeepAlive?.(true, 1000);
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

      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      });
      res.flushHeaders?.();

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
    context: { success?: string; error?: string; meta?: Record<string, unknown> }
  ) {
    try {
      const data = await operation();
      if (context.success) {
        pushLog("info", context.success, context.meta);
      }
      res.json({ ok: true, data });
    } catch (error) {
      const isValidation = error instanceof ZodError;
      const message = error instanceof Error ? error.message : String(error);
      const meta = { ...(context.meta ?? {}), error: message };
      pushLog("error", context.error ?? "api-error", meta);
      res.status(isValidation ? 400 : 500).json({ ok: false, error: message });
    }
  }

  app.post("/api/search", async (req, res) => {
    await respond(res, () => httpToolkit.searchLocal(req.body), {
      success: "search-completed",
      error: "search-failed",
      meta: { query: req.body?.query },
    });
  });

  app.post("/api/doc", async (req, res) => {
    await respond(res, () => httpToolkit.getDoc(req.body), {
      success: "doc-loaded",
      error: "doc-failed",
      meta: { path: req.body?.path, page: req.body?.page },
    });
  });

  app.get("/api/stats", async (_req, res) => {
    await respond(res, () => httpToolkit.stats(), {
      success: "stats-loaded",
      error: "stats-failed",
    });
  });

  app.post("/api/reindex", async (req, res) => {
    await respond(res, () => httpToolkit.reindex(req.body ?? {}), {
      success: "reindex-completed",
      error: "reindex-failed",
      meta: { paths: req.body?.paths },
    });
  });

  app.post("/api/watch", async (req, res) => {
    await respond(res, () => httpToolkit.watch(req.body ?? {}, { sessionId: "http" }), {
      success: "watch-started",
      error: "watch-failed",
      meta: { paths: req.body?.paths },
    });
  });

  app.post("/api/import", async (req, res) => {
    await respond(res, () => httpToolkit.importChatGPT(req.body), {
      success: "import-completed",
      error: "import-failed",
      meta: { outDir: req.body?.outDir },
    });
  });

  app.get("/api/logs", (_req, res) => {
    res.json({ ok: true, data: logs });
  });

  app.get("/api/logs/stream", (req, res) => {
    req.setTimeout?.(0);
    req.socket?.setKeepAlive?.(true, 1000);
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.flushHeaders?.();
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

  const staticInfo = options.disableStatic ? null : resolveStaticDir();
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

  async function dispose() {
    for (const subscriber of logSubscribers) {
      try {
        subscriber.end();
      } catch (error) {
        logger.warn("log-stream-close-failed", {
          err: error instanceof Error ? error.message : String(error),
        });
      }
    }
    logSubscribers.clear();

    const closing: Promise<void>[] = [];
    for (const [sessionId, session] of sessions.entries()) {
      sessions.delete(sessionId);
      closing.push(
        session.transport
          .close()
          .catch(() => {})
          .then(() => session.server.close().catch(() => {}))
      );
    }
    await Promise.all(closing);
  }

  return { app, logs, pushLog, sessions, staticInfo, dispose };
}
