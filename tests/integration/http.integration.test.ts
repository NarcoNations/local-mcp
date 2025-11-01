import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createHttpApp, CreateHttpAppResult } from "../../src/http/app.js";
import { AppConfig } from "../../src/config.js";
import os from "node:os";
import path from "node:path";
import { promises as fs } from "node:fs";
import http from "node:http";

const tempDirs: string[] = [];

async function createConfig(): Promise<AppConfig> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "mcp-http-test-"));
  tempDirs.push(root);
  return {
    roots: {
      roots: [root],
      include: [".md"],
      exclude: [],
    },
    index: {
      chunkSize: 1000,
      chunkOverlap: 0,
      ocrEnabled: false,
      ocrTriggerMinChars: 0,
      useSQLiteVSS: false,
      model: "test-model",
    },
    out: {
      dataDir: path.join(root, "data"),
    },
  };
}

describe("HTTP control room API", () => {
  let appCtx: CreateHttpAppResult;
  const toolkit = {
    searchLocal: vi.fn(async (body) => ({ hits: [{ id: "1", score: 0.9, query: body?.query }] })),
    getDoc: vi.fn(async () => ({ text: "example" })),
    stats: vi.fn(async () => ({ documents: 1 })),
    reindex: vi.fn(async () => ({ indexed: 1, updated: 1, skipped: 0 })),
    watch: vi.fn(async () => ({ watching: ["/tmp"] })),
    importChatGPT: vi.fn(async () => ({ imported: 2 })),
  };

  beforeAll(async () => {
    const config = await createConfig();
    appCtx = await createHttpApp({
      config,
      httpToolkit: toolkit,
      sessionToolkitFactory: () => toolkit,
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
    appCtx.clearLogs();
  });

  afterAll(async () => {
    await appCtx.close();
    await Promise.all(tempDirs.map((dir) => fs.rm(dir, { recursive: true, force: true })));
  });

  it("executes REST endpoints and records success logs", async () => {
    const agent = request(appCtx.app);
    const res = await agent.post("/api/search").send({ query: "alpha" });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(toolkit.searchLocal).toHaveBeenCalledWith({ query: "alpha" });

    const logs = appCtx.getLogs();
    expect(logs.some((entry) => entry.message === "search-completed" && entry.details?.query === "alpha")).toBe(true);
  });

  it("handles tool errors with 500 and emits error log", async () => {
    toolkit.getDoc.mockRejectedValueOnce(new Error("boom"));
    const agent = request(appCtx.app);
    const res = await agent.post("/api/doc").send({ path: "doc.md" });
    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
    const logs = appCtx.getLogs();
    expect(logs.some((entry) => entry.message === "doc-failed" && entry.details?.error === "boom")).toBe(true);
  });

  it("streams log events to SSE subscribers", async () => {
    const server = await new Promise<import("http").Server>((resolve) => {
      const listener = appCtx.app.listen(0, "127.0.0.1", () => resolve(listener));
    });
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("unable to acquire port");
    const marker = `test-${Date.now()}`;
    const chunks: string[] = [];

    await new Promise<void>((resolve, reject) => {
      let settled = false;
      let timeout: NodeJS.Timeout | null = null;
      let response: http.IncomingMessage | null = null;
      let req: http.ClientRequest;

      const finish = (error?: Error) => {
        if (settled) return;
        settled = true;
        if (timeout) clearTimeout(timeout);
        response?.destroy();
        req.destroy();
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      };

      req = http.request(
        {
          hostname: "127.0.0.1",
          port: address.port,
          path: "/api/logs/stream",
          method: "GET",
          headers: { Accept: "text/event-stream" },
        },
        (res) => {
          response = res;
          res.setEncoding("utf8");
          res.on("data", (chunk) => {
            chunks.push(chunk);
            if (chunk.includes(marker)) {
              finish();
            }
          });
          res.on("error", (err) => {
            const error = err instanceof Error ? err : new Error(String(err));
            finish(error);
          });
        }
      );

      req.on("error", (err) => {
        const error = err instanceof Error ? err : new Error(String(err));
        finish(error);
      });
      req.end();

      timeout = setTimeout(() => {
        finish(new Error("timeout waiting for SSE payload"));
      }, 5_000);

      setTimeout(() => {
        appCtx.pushLog("info", marker);
      }, 25);
    });

    await new Promise<void>((resolve) => server.close(() => resolve()));

    expect(chunks.join("")).toContain(marker);
  });
});

