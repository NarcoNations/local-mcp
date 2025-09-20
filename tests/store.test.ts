import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { KnowledgeStore } from "../src/store/store.js";
import { DEFAULTS } from "../src/config.js";
import { promises as fs } from "node:fs";
import path from "node:path";

process.env.MCP_NN_EMBED_STUB = "1";

const dataDir = ".mcp-nn-test";

const config = {
  roots: { ...DEFAULTS.roots, roots: ["./fixtures"] },
  index: { ...DEFAULTS.index },
  out: { dataDir },
};

describe("KnowledgeStore", () => {
  const store = new KnowledgeStore(config);

  beforeAll(async () => {
    await fs.rm(path.join(process.cwd(), dataDir), { recursive: true, force: true });
    await store.init();
  });

  afterAll(async () => {
    await fs.rm(path.join(process.cwd(), dataDir), { recursive: true, force: true });
  });

  it("indexes fixtures and returns stats", async () => {
    const result = await store.indexPaths(["./fixtures"]);
    expect(result.indexed).toBeGreaterThan(0);
    const stats = store.stats();
    expect(stats.files).toBeGreaterThan(0);
  });
});
