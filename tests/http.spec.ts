import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import { createHttpServer, type HttpServerRuntime } from "../src/http/app.js";
import type { AppConfig } from "../src/config.js";
import type { ToolKit } from "../src/mcp/toolkit.js";

interface ToolkitMocks {
  searchLocal: ReturnType<typeof vi.fn>;
  getDoc: ReturnType<typeof vi.fn>;
  stats: ReturnType<typeof vi.fn>;
  reindex: ReturnType<typeof vi.fn>;
  watch: ReturnType<typeof vi.fn>;
  importChatGPT: ReturnType<typeof vi.fn>;
}

function createConfig(): AppConfig {
  return {
    roots: { roots: [], include: [], exclude: [] },
    index: {
      chunkSize: 100,
      chunkOverlap: 0,
      ocrEnabled: false,
      ocrTriggerMinChars: 0,
      useSQLiteVSS: false,
      model: "test-model",
      maxFileSizeMB: 5,
      concurrency: 1,
      languages: ["eng"],
    },
    out: { dataDir: ".tmp-http-tests" },
  };
}

function createToolkitMocks(): ToolkitMocks {
  return {
    searchLocal: vi.fn(async (body: any) => ({
      hits: [{ path: "/doc.txt", score: 0.92 }],
      query: body?.query ?? "",
    })),
    getDoc: vi.fn(async (body: any) => ({
      path: body?.path ?? "/doc.txt",
      page: body?.page ?? null,
      text: "Document text",
    })),
    stats: vi.fn(async () => ({ documents: 1, tokens: 42 })),
    reindex: vi.fn(async (body: any) => ({
      updatedPaths: body?.paths ?? [],
      durationMs: 12,
    })),
    watch: vi.fn(async (body: any, extra?: Record<string, unknown>) => ({
      watching: body?.paths ?? [],
      session: extra?.sessionId,
    })),
    importChatGPT: vi.fn(async (body: any) => ({
      outDir: body?.outDir ?? "./out",
      importedCount: 3,
    })),
  };
}

function asToolkit(mocks: ToolkitMocks): ToolKit {
  return mocks as unknown as ToolKit;
}

describe("HTTP API integration", () => {
  let server: HttpServerRuntime;
  let mocks: ToolkitMocks;

  beforeEach(async () => {
    mocks = createToolkitMocks();
    server = await createHttpServer({
      config: createConfig(),
      toolkit: asToolkit(mocks),
      toolkitFactory: () => asToolkit(createToolkitMocks()),
    });
  });

  afterEach(async () => {
    await server.close();
    vi.clearAllMocks();
  });

  it("proxies search requests to the toolkit", async () => {
    const response = await request(server.app)
      .post("/api/search")
      .send({ query: "neural" });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ ok: true });
    expect(response.body.data).toMatchObject({ query: "neural" });
    expect(mocks.searchLocal).toHaveBeenCalledWith({ query: "neural" });
  });

  it("returns document payloads", async () => {
    const response = await request(server.app)
      .post("/api/doc")
      .send({ path: "/notes.md", page: 2 });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ path: "/notes.md", page: 2 });
    expect(mocks.getDoc).toHaveBeenCalledWith({ path: "/notes.md", page: 2 });
  });

  it("exposes stats, reindex, watch, and import flows", async () => {
    const stats = await request(server.app).get("/api/stats");
    expect(stats.status).toBe(200);
    expect(stats.body.data).toMatchObject({ documents: 1 });

    const reindex = await request(server.app)
      .post("/api/reindex")
      .send({ paths: ["./docs"] });
    expect(reindex.status).toBe(200);
    expect(mocks.reindex).toHaveBeenCalledWith({ paths: ["./docs"] });

    const watch = await request(server.app)
      .post("/api/watch")
      .send({ paths: ["./docs"] });
    expect(watch.status).toBe(200);
    expect(mocks.watch).toHaveBeenCalledWith({ paths: ["./docs"] }, { sessionId: "http" });

    const importResponse = await request(server.app)
      .post("/api/import")
      .send({ outDir: "./converted" });
    expect(importResponse.status).toBe(200);
    expect(mocks.importChatGPT).toHaveBeenCalledWith({ outDir: "./converted" });
  });

  it("records structured log entries for API calls", async () => {
    await request(server.app).post("/api/search").send({ query: "audit" });
    await request(server.app).post("/api/reindex").send({ paths: [] });

    const logs = await request(server.app).get("/api/logs");
    expect(logs.status).toBe(200);
    const messages = (logs.body.data as Array<{ message: string }>).map(
      (entry) => entry.message
    );
    expect(messages).toContain("search-completed");
    expect(messages).toContain("reindex-completed");
  });

  it("surfaces validation failures as 400 errors", async () => {
    const error = new ZodError([]);
    mocks.searchLocal.mockRejectedValueOnce(error);

    const response = await request(server.app)
      .post("/api/search")
      .send({ query: "invalid" });

    expect(response.status).toBe(400);
    expect(response.body.ok).toBe(false);
    expect(mocks.searchLocal).toHaveBeenCalledTimes(1);
  });

  it("exposes health metrics", async () => {
    const response = await request(server.app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ ok: true, sessions: 0 });
  });
});
