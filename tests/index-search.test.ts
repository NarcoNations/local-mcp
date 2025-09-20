import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "fs/promises";
import os from "os";
import path from "path";
import { AppConfig } from "../src/types.js";
import { Store } from "../src/store/store.js";
import { getEmbedder } from "../src/pipeline/embed.js";
import { reindex } from "../src/tools/reindex.js";
import { searchLocal } from "../src/tools/searchLocal.js";
import { getDoc } from "../src/tools/getDoc.js";

const fixtureRoot = path.resolve("tests/fixtures/corpus");

interface TestContext {
  config: AppConfig;
  store: Store;
  embedder: ReturnType<typeof getEmbedder>;
}

describe("reindex and search", () => {
  let tmpDir: string;
  let context: TestContext;

  beforeEach(async () => {
    process.env.MCP_NN_EMBED_FAKE = "1";
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "mcp-nn-test-"));
    const config: AppConfig = {
      roots: {
        roots: [fixtureRoot],
        include: [".md", ".txt"],
        exclude: [],
      },
      index: {
        chunkSize: 200,
        chunkOverlap: 40,
        ocrEnabled: false,
        ocrTriggerMinChars: 100,
        useSQLiteVSS: false,
        model: "Xenova/all-MiniLM-L6-v2",
        maxFileSizeMB: 5,
        concurrency: 1,
        languages: ["eng"],
      },
      out: {
        dataDir: tmpDir,
      },
    };
    const store = await Store.load(config);
    const embedder = getEmbedder(config);
    context = { config, store, embedder };
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("indexes fixture corpus and returns search results", async () => {
    const stats = await reindex(context, {});
    expect(stats.indexed + stats.updated).toBeGreaterThan(0);

    const result = await searchLocal(context, { query: "cocaine Antwerp", k: 4, alpha: 0.5 });
    expect(result.results.length).toBeGreaterThan(0);
    const first = result.results[0];
    expect(first.citation.filePath).toContain("tests/fixtures/corpus");

    const doc = await getDoc(context, { path: first.citation.filePath });
    expect(doc.text.length).toBeGreaterThan(10);
  });
});
