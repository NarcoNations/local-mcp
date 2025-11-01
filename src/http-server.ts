import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import express, { Request, Response } from "express";
import cors from "cors";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { ZodError } from "zod";
import { AppConfig, loadConfig } from "./config.js";
import { logger } from "./utils/logger.js";
import { ToolKit, createToolKit, registerMcpTools } from "./mcp/toolkit.js";

export interface LogEntry {
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

interface HttpServerState {
  readonly sessions: Map<string, SessionState>;
  getLogs(): LogEntry[];
  pushLog(level: LogEntry["level"], message: string, details?: Record<string, unknown>): void;
}

export interface CreateHttpServerOptions {
  config?: AppConfig;
  toolkit?: ToolKit;
  enableSse?: boolean;
  createToolkit?: (config: AppConfig, options?: { server?: McpServer; onWatchEvent?: (event: Record<string, unknown>) => void }) => ToolKit;
}

export interface HttpServerInstance {
  app: express.Express;
  config: AppConfig;
  toolkit: ToolKit;
  state: HttpServerState;
  start(options?: { port?: number; host?: string }): Promise<http.Server>;
  stop(): Promise<void>;
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

export async function createHttpServer(options: CreateHttpServerOptions = {}): Promise<HttpServerInstance> {
  const config = options.config ?? (await loadConfig());
  const sessions = new Map<string, SessionState>();
  const logSubscribers = new Set<Response>();
  const logs: LogEntry[] = [];
  const MAX_LOGS = 250;

  const pushLog = (level: LogEntry["level"], message: string, details?: Record<string, unknown>) => {
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
  };

  const baseToolkit = options.toolkit ?? createToolKit(config, {
    onWatchEvent: (event) => pushLog("info", "watch-event", event as Record<string, unknown>),
  });
  const toolkitFactory = options.createToolkit ?? ((cfg, extra) => createToolKit(cfg, extra));

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

  const enableSse = options.enableSse ?? true;
  if (enableSse) {
    app.get("/mcp/sse", async (req, res) => {
      let transport: SSEServerTransport | null = null;
      try {
        const sessionServer = new McpServer({ name: "mcp-nn", version: "1.1.0" }, {
          capabilities: { tools: {}, logging: {} },
          instructions:
            "Local research MCP server. Use search_local for retrieval, get_doc for source text, reindex/watch to refresh, stats for corpus metrics, and import_chatgpt_export to convert ChatGPT exports.",
        });
        const sessionToolkit = toolkitFactory(config, {
          server: sessionServer,
          onWatchEvent: (event) => pushLog("info", "watch-event", event as Record<string, unknown>),
        });
        registerMcpTools(sessionServer, sessionToolkit);

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
  }

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

  async function respond<T>(res: Response, operation: () => Promise<T>, context: { success?: string; error?: string; meta?: Record<string, unknown> }) {
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
    await respond(
      res,
      () => baseToolkit.searchLocal(req.body),
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
      () => baseToolkit.getDoc(req.body),
      {
        success: "doc-loaded",
        error: "doc-failed",
        meta: { path: req.body?.path, page: req.body?.page },
      }
    );
  });

  app.get("/api/stats", async (_req, res) => {
    await respond(res, () => baseToolkit.stats(), {
      success: "stats-loaded",
      error: "stats-failed",
    });
  });

  app.post("/api/reindex", async (req, res) => {
    await respond(
      res,
      () => baseToolkit.reindex(req.body ?? {}),
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
      () => baseToolkit.watch(req.body ?? {}, { sessionId: "http" }),
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
      () => baseToolkit.importChatGPT(req.body),
      {
        success: "import-completed",
        error: "import-failed",
        meta: { outDir: req.body?.outDir },
      }
    );
  });

  app.get("/api/logs", (_req, res) => {
    res.json({ ok: true, data: logs });
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
    const fallbackRoute = /^(?!\/(?:api|mcp))(.*)$/;
    app.get(fallbackRoute, (_req, res) => {
      res.sendFile(staticInfo.index);
    });
  }

  let server: http.Server | null = null;

  const start = async (listenOptions?: { port?: number; host?: string }) => {
    if (server) {
      return server;
    }
    const port = listenOptions?.port ?? Number(process.env.HTTP_PORT ?? process.env.PORT ?? 3030);
    const host = listenOptions?.host ?? process.env.HOST ?? "0.0.0.0";
    await new Promise<void>((resolve) => {
      server = app.listen(port, host, () => {
        logger.info("http-listening", { port, host, staticRoot: staticInfo?.root });
        pushLog("info", "http-listening", { port, host, staticRoot: staticInfo?.root });
        resolve();
      });
    });
    return server!;
  };

  const stop = async () => {
    if (!server) return;
    await new Promise<void>((resolve, reject) => {
      server!.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
    server = null;
  };

  return {
    app,
    config,
    toolkit: baseToolkit,
    state: {
      sessions,
      getLogs: () => [...logs],
      pushLog,
    },
    start,
    stop,
  };
}
