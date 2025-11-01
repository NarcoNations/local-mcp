import request from "supertest";
import { describe, it, expect, vi } from "vitest";
import { ZodError } from "zod";
import { createHttpServer } from "../src/http-server.js";
import type { ToolKit } from "../src/mcp/toolkit.js";
import type { AppConfig } from "../src/config.js";

function createConfig(): AppConfig {
  return {
    roots: { roots: [], include: [], exclude: [] },
    index: {
      chunkSize: 1024,
      chunkOverlap: 64,
      ocrEnabled: false,
      ocrTriggerMinChars: 0,
      useSQLiteVSS: false,
      model: "test-model",
    },
    out: { dataDir: ".mcp-http-test" },
  };
}

async function setup(overrides?: Partial<ToolKit>) {
  const toolkit: ToolKit = {
    searchLocal: vi.fn().mockResolvedValue({ results: [{ id: "chunk-1" }] }),
    getDoc: vi.fn().mockResolvedValue({ text: "doc" }),
    stats: vi.fn().mockResolvedValue({ chunks: 1, embeddingsCached: 0, files: {}, byType: {} }),
    reindex: vi.fn().mockResolvedValue({ indexed: 2, updated: 1, skipped: 0 }),
    watch: vi.fn().mockResolvedValue({ watching: ["/tmp"] }),
    importChatGPT: vi.fn().mockResolvedValue({ filesWritten: 1, indexed: 2 }),
    ...overrides,
  };
  const instance = await createHttpServer({ config: createConfig(), toolkit, enableSse: false });
  return { instance, toolkit };
}

describe("HTTP API", () => {
  it("responds with search results and logs success", async () => {
    const { instance, toolkit } = await setup();
    const response = await request(instance.app).post("/api/search").send({ query: "alpha" });

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(toolkit.searchLocal).toHaveBeenCalledWith({ query: "alpha" });
    const logs = instance.state.getLogs();
    expect(logs.some((entry) => entry.message === "search-completed" && entry.details?.query === "alpha")).toBe(true);
  });

  it("bubbles up toolkit errors with 500 status", async () => {
    const failingSearch = vi.fn().mockRejectedValue(new Error("boom"));
    const { instance } = await setup({ searchLocal: failingSearch });

    const response = await request(instance.app).post("/api/search").send({ query: "fail" });
    expect(response.status).toBe(500);
    expect(response.body.ok).toBe(false);
    const logs = instance.state.getLogs();
    expect(logs.some((entry) => entry.message === "search-failed" && entry.details?.error === "boom")).toBe(true);
  });

  it("treats validation errors as bad requests", async () => {
    const validationError = vi.fn().mockRejectedValue(new ZodError([]));
    const { instance } = await setup({ getDoc: validationError });

    const response = await request(instance.app).post("/api/doc").send({ path: "" });
    expect(response.status).toBe(400);
    expect(response.body.ok).toBe(false);
    const logs = instance.state.getLogs();
    expect(logs.some((entry) => entry.message === "doc-failed" && entry.details?.error)).toBe(true);
  });

  it("exposes stats and watches for follow-up calls", async () => {
    const { instance, toolkit } = await setup();
    await request(instance.app).get("/api/stats").expect(200);
    expect(toolkit.stats).toHaveBeenCalled();

    await request(instance.app).post("/api/reindex").send({ paths: ["/docs"] }).expect(200);
    expect(toolkit.reindex).toHaveBeenCalledWith({ paths: ["/docs"] });

    await request(instance.app).post("/api/watch").send({ paths: ["/docs"] }).expect(200);
    expect(toolkit.watch).toHaveBeenCalledWith({ paths: ["/docs"] }, { sessionId: "http" });

    await request(instance.app).post("/api/import").send({ exportPath: "./zip" }).expect(200);
    expect(toolkit.importChatGPT).toHaveBeenCalledWith({ exportPath: "./zip" });
  });

  it("returns accumulated logs and health info", async () => {
    const { instance } = await setup();
    await request(instance.app).post("/api/search").send({ query: "beta" });

    const logsResponse = await request(instance.app).get("/api/logs");
    expect(logsResponse.status).toBe(200);
    expect(Array.isArray(logsResponse.body.data)).toBe(true);
    expect(logsResponse.body.data.some((entry: any) => entry.message === "search-completed")).toBe(true);

    const healthResponse = await request(instance.app).get("/health");
    expect(healthResponse.status).toBe(200);
    expect(healthResponse.body.sessions).toBe(0);
  });

  it("guards message endpoints when session is missing", async () => {
    const { instance } = await setup();
    const post = await request(instance.app).post("/mcp/messages").send({});
    expect(post.status).toBe(400);

    const del = await request(instance.app).delete("/mcp/messages").send();
    expect(del.status).toBe(400);
  });
});
