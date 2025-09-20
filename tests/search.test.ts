import { promises as fs } from "fs";
import { tmpdir } from "os";
import path from "path";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";

vi.mock("../src/pipeline/embed", () => ({
  embedText: vi.fn(async (text: string) => {
    const length = text.length;
    const words = text.split(/\s+/).length;
    return new Float32Array([length, words, length + words]);
  }),
  onModelStatus: vi.fn(),
}));

import { ResearchStore } from "../src/store/store.js";
import type { AppConfig } from "../src/config.js";

const tmpRoots: string[] = [];

afterAll(async () => {
  await Promise.all(tmpRoots.map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

function buildConfig(root: string, dataDir: string): AppConfig {
  return {
    roots: {
      roots: [root],
      include: [".txt"],
      exclude: [],
    },
    index: {
      chunkSize: 1200,
      chunkOverlap: 50,
      ocrEnabled: false,
      ocrTriggerMinChars: 100,
      useSQLiteVSS: false,
      model: "stub",
      maxFileSizeMB: 10,
      concurrency: 1,
    },
    out: {
      dataDir,
    },
  };
}

describe("store hybrid search", () => {
  let docsDir: string;
  let dataDir: string;

  beforeAll(async () => {
    const base = await fs.mkdtemp(path.join(tmpdir(), "mcp-store-"));
    docsDir = path.join(base, "docs");
    dataDir = path.join(base, "data");
    tmpRoots.push(base);
    await fs.mkdir(docsDir, { recursive: true });
    await fs.writeFile(path.join(docsDir, "antwerp.txt"), "Antwerp remains a primary entry point for cocaine shipments.");
    await fs.writeFile(path.join(docsDir, "coffee.txt"), "Colombia exports coffee through Cartagena.");
  });

  test("returns ranked results", async () => {
    const config = buildConfig(docsDir, dataDir);
    const store = new ResearchStore(config);
    await store.ready();
    await store.reindex([docsDir]);

    const results = await store.search("cocaine antwerp", { k: 5, alpha: 0.6 });
    expect(results.length).toBeGreaterThan(0);
    const top = results[0];
    expect(top.citation.filePath).toContain("antwerp.txt");
  });
});
