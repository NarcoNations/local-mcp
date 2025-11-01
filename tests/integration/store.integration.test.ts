import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import os from "node:os";
import path from "node:path";
import { promises as fs } from "node:fs";
import { KnowledgeStore } from "../../src/store/store.js";
import { AppConfig } from "../../src/config.js";

vi.mock("../../src/pipeline/embed.ts", () => ({
  embedText: vi.fn(async (text: string) => {
    const magnitude = Math.max(1, text.length % 1000);
    return Float32Array.from([magnitude, magnitude / 2, 1]);
  }),
}));

const tempDirs: string[] = [];

async function createConfig(): Promise<{ config: AppConfig; docsDir: string }> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "mcp-store-test-"));
  const docsDir = path.join(root, "docs");
  await fs.mkdir(docsDir, { recursive: true });
  const config: AppConfig = {
    roots: {
      roots: [docsDir],
      include: [".md"],
      exclude: [],
    },
    index: {
      chunkSize: 500,
      chunkOverlap: 50,
      ocrEnabled: false,
      ocrTriggerMinChars: 0,
      useSQLiteVSS: false,
      model: "test-model",
    },
    out: {
      dataDir: path.join(root, "data"),
    },
  };
  tempDirs.push(root);
  return { config, docsDir };
}

describe("KnowledgeStore indexing", () => {
  let config: AppConfig;
  let docsDir: string;

  beforeEach(async () => {
    const setup = await createConfig();
    config = setup.config;
    docsDir = setup.docsDir;
  });

  afterAll(async () => {
    await Promise.all(tempDirs.map((dir) => fs.rm(dir, { recursive: true, force: true })));
  });

  it("indexes new markdown files and exposes manifest", async () => {
    const file = path.join(docsDir, "alpha.md");
    await fs.writeFile(file, "# Alpha\n\nContent for the initial index.");

    const store = new KnowledgeStore(config);
    await store.load();
    const stats = await store.reindex([]);

    expect(stats.indexed).toBeGreaterThan(0);
    const manifest = store.getManifest();
    expect(Object.keys(manifest.files)).toContain(file);
    expect(manifest.chunks).toBeGreaterThan(0);

    const keywordHits = store.searchKeyword("Alpha", 5);
    expect(keywordHits[0]?.chunk.path).toBe(file);
  });

  it("updates existing documents and rebuilds vector cache", async () => {
    const file = path.join(docsDir, "beta.md");
    await fs.writeFile(file, "First version text.");

    const store = new KnowledgeStore(config);
    await store.load();
    await store.reindex([file]);

    const initialManifest = store.getManifest();
    const initialChunks = initialManifest.files[file].chunkIds.length;

    await fs.writeFile(file, "Second version with more narrative content.");
    const stats = await store.reindex([file]);

    expect(stats.updated).toBe(1);
    const manifest = store.getManifest();
    expect(manifest.files[file].chunkIds.length).toBeGreaterThanOrEqual(initialChunks);
    expect(manifest.embeddingsCached).toBe(manifest.chunks);
  });
});

