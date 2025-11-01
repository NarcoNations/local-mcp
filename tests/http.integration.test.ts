import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createHttpServer, type HttpServerInstance } from "../src/http.js";
import { DEFAULT_CONFIG, type AppConfig } from "../src/config.js";
import type { ToolKit } from "../src/mcp/toolkit.js";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

interface HttpTestResources {
  server?: HttpServerInstance;
  baseUrl?: string;
  dataDir?: string;
}

let resources: HttpTestResources | undefined;

function createStubToolkit(): ToolKit {
  return {
    searchLocal: async (input?: any) => ({
      query: input?.query ?? "",
      results: [],
    }),
    getDoc: async (input?: any) => ({
      path: input?.path ?? "stub", 
      page: input?.page,
      text: "example",
    }),
    reindex: async () => ({ indexed: 0, updated: 0, skipped: 0 }),
    watch: async (input?: any) => ({ watching: Array.isArray(input?.paths) ? input.paths : [] }),
    stats: async () => ({ documents: 0, chunks: 0 }),
    importChatGPT: async () => ({ imported: 0, outputPath: "stub" }),
  } as ToolKit;
}

describe.sequential("HTTP integration", () => {
  beforeAll(async () => {
    const tempDir = await mkdtemp(path.join(tmpdir(), "mcp-http-test-"));
    const config: AppConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    config.out.dataDir = path.join(tempDir, ".mcp-nn");
    config.roots.roots = [tempDir];

    const server = await createHttpServer({
      config,
      toolkit: createStubToolkit(),
      toolkitFactory: () => createStubToolkit(),
      host: "127.0.0.1",
    });

    const listener = await server.start(0, "127.0.0.1");
    const address = listener.address();
    if (!address || typeof address === "string") {
      throw new Error("Failed to determine server address");
    }

    resources = {
      server,
      baseUrl: `http://127.0.0.1:${address.port}`,
      dataDir: tempDir,
    };
  });

  afterAll(async () => {
    if (!resources) return;
    await resources.server?.stop();
    if (resources.dataDir) {
      await rm(resources.dataDir, { recursive: true, force: true });
    }
    resources = undefined;
  });

  it("responds to REST endpoints", async () => {
    if (!resources?.baseUrl) throw new Error("Missing test server");

    const searchResponse = await fetch(`${resources.baseUrl}/api/search`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: "test" }),
    });
    expect(searchResponse.status).toBe(200);
    const searchBody = await searchResponse.json();
    expect(searchBody).toMatchObject({ ok: true, data: { query: "test", results: [] } });

    const statsResponse = await fetch(`${resources.baseUrl}/api/stats`);
    expect(statsResponse.status).toBe(200);
    const statsBody = await statsResponse.json();
    expect(statsBody).toMatchObject({ ok: true, data: { documents: 0, chunks: 0 } });

    const watchResponse = await fetch(`${resources.baseUrl}/api/watch`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ paths: ["stub"] }),
    });
    expect(watchResponse.status).toBe(200);
    const watchBody = await watchResponse.json();
    expect(watchBody).toMatchObject({ ok: true, data: { watching: ["stub"] } });
  });

  it("establishes SSE sessions", async () => {
    if (!resources?.baseUrl) throw new Error("Missing test server");

    const controller = new AbortController();
    const response = await fetch(`${resources.baseUrl}/mcp/sse`, {
      signal: controller.signal,
      headers: {
        Accept: "text/event-stream",
      },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/event-stream");
    const sessionId =
      response.headers.get("mcp-session-id") ?? response.headers.get("Mcp-Session-Id") ?? undefined;
    expect(sessionId).toBeTruthy();

    const reader = response.body?.getReader();
    await reader?.read();
    await reader?.cancel();
  });
});
