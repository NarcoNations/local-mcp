import { describe, expect, it, vi, beforeEach } from "vitest";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AppConfig } from "../src/config.js";
import { createToolKit, registerMcpTools } from "../src/mcp/toolkit.js";

const searchLocalImpl = vi.fn(async (input: { query: string }) => ({
  query: input.query,
  hits: [{ path: "/docs/file.md", score: 0.88 }],
}));

const getDocImpl = vi.fn(async (input: { path: string; page?: number }) => ({
  path: input.path,
  page: input.page ?? null,
  text: "stub-content",
}));

const reindexImpl = vi.fn(async (input: { paths?: string[] }) => ({
  updated: input.paths ?? [],
}));

const statsImpl = vi.fn(async () => ({ documents: 4, tokens: 128 }));

const importImpl = vi.fn(async (input: { outDir?: string }) => ({
  outDir: input.outDir ?? "./out",
  imported: 2,
}));

const watchImpl = vi.fn(
  async (input: { paths?: string[] }, extra?: Record<string, unknown>) => ({
    watching: input.paths ?? [],
    session: extra?.sessionId,
  })
);

vi.mock("../src/tools/searchLocal.js", () => ({
  createSearchLocalTool: vi.fn(() => searchLocalImpl),
  SearchLocalInputSchema: z.object({ query: z.string() }),
  SearchLocalShape: z.object({ query: z.string() }),
}));

vi.mock("../src/tools/getDoc.js", () => ({
  createGetDocTool: vi.fn(() => getDocImpl),
  GetDocInputSchema: z.object({ path: z.string(), page: z.number().optional() }),
  GetDocShape: z.object({ path: z.string(), page: z.number().optional() }),
}));

vi.mock("../src/tools/reindex.js", () => ({
  createReindexTool: vi.fn(() => reindexImpl),
  ReindexInputSchema: z.object({ paths: z.array(z.string()).optional() }),
  ReindexShape: z.object({ paths: z.array(z.string()).optional() }),
}));

vi.mock("../src/tools/stats.js", () => ({
  createStatsTool: vi.fn(() => statsImpl),
}));

vi.mock("../src/tools/importChatGPT.js", () => ({
  createImportChatGPTTool: vi.fn(() => importImpl),
  ImportChatGPTSchema: z.object({ outDir: z.string().optional() }),
  ImportChatGPTShape: z.object({ outDir: z.string().optional() }),
}));

vi.mock("../src/tools/watch.js", () => ({
  createWatchTool: vi.fn(
    (
      _config: AppConfig,
      onEvent?: (event: Record<string, unknown>, extra?: Record<string, unknown>) => void
    ) => {
      return async (
        input: { paths?: string[] },
        extra?: Record<string, unknown>
      ) => {
        onEvent?.({ type: "watch-start", paths: input.paths ?? [] }, extra);
        return watchImpl(input, extra);
      };
    }
  ),
  WatchInputSchema: z.object({ paths: z.array(z.string()).optional() }),
  WatchShape: z.object({ paths: z.array(z.string()).optional() }),
}));

function createConfig(): AppConfig {
  return {
    roots: { roots: ["./docs"], include: [".md"], exclude: [] },
    index: {
      chunkSize: 200,
      chunkOverlap: 20,
      ocrEnabled: false,
      ocrTriggerMinChars: 0,
      useSQLiteVSS: false,
      model: "stub-model",
    },
    out: { dataDir: ".mocks" },
  };
}

describe("MCP toolkit integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates toolkit functions that forward to underlying tool implementations", async () => {
    const toolkit = createToolKit(createConfig(), {
      onWatchEvent: vi.fn(),
    });

    await toolkit.searchLocal({ query: "vector" });
    await toolkit.getDoc({ path: "/docs/file.md" });
    await toolkit.reindex({ paths: ["./docs"] });
    await toolkit.stats();
    await toolkit.importChatGPT({ outDir: "./out" });
    await toolkit.watch({ paths: ["./docs"] }, { sessionId: "abc" });

    expect(searchLocalImpl).toHaveBeenCalledWith({ query: "vector" });
    expect(getDocImpl).toHaveBeenCalledWith({ path: "/docs/file.md" });
    expect(reindexImpl).toHaveBeenCalledWith({ paths: ["./docs"] });
    expect(statsImpl).toHaveBeenCalled();
    expect(importImpl).toHaveBeenCalledWith({ outDir: "./out" });
    expect(watchImpl).toHaveBeenCalledWith({ paths: ["./docs"] }, { sessionId: "abc" });
  });

  it("emits watch events through the provided callback", async () => {
    const onWatchEvent = vi.fn();
    const toolkit = createToolKit(createConfig(), { onWatchEvent });

    await toolkit.watch({ paths: ["./docs"] }, { sessionId: "local" });

    expect(onWatchEvent).toHaveBeenCalledWith({ type: "watch-start", paths: ["./docs"] }, {
      sessionId: "local",
    });
  });

  it("registers MCP tools that invoke the toolkit functions", async () => {
    const toolkit = createToolKit(createConfig());
    const server = new McpServer({ name: "test", version: "1.0.0" }, { capabilities: { tools: {} } });

    registerMcpTools(server, toolkit);

    const registeredTools = (server as any)._registeredTools as Record<string, { callback: Function }>;

    const searchResult = await registeredTools["search_local"].callback({ query: "index" });
    expect(searchLocalImpl).toHaveBeenCalledWith({ query: "index" });
    expect(searchResult.structuredContent).toMatchObject({ query: "index" });

    const watchResult = await registeredTools["watch"].callback(
      { paths: ["./docs"] },
      { sessionId: "remote" }
    );
    expect(watchImpl).toHaveBeenCalledWith({ paths: ["./docs"] }, { sessionId: "remote" });
    expect(watchResult.structuredContent).toMatchObject({ watching: ["./docs"] });
  });
});
