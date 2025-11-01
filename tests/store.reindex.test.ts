import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import type { AppConfig } from "../src/config.js";

vi.mock("../src/pipeline/embed.js", () => ({
  embedText: vi.fn(async (text: string, cacheKey: string) =>
    Float32Array.from([Math.max(1, text.length % 5), Math.max(1, cacheKey.length % 7), 0.5])
  ),
}));

const { KnowledgeStore } = await import("../src/store/store.js");
const { embedText } = await import("../src/pipeline/embed.js");
const embedTextMock = embedText as unknown as ReturnType<typeof vi.fn>;

interface TestEnv {
  store: InstanceType<typeof KnowledgeStore>;
  filePath: string;
  dataDir: string;
  cleanup(): Promise<void>;
}

async function createEnv(): Promise<TestEnv> {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "mcp-store-"));
  const dataDir = path.join(tmpRoot, "data");
  const filePath = path.join(tmpRoot, "report.md");
  await fs.writeFile(
    filePath,
    "# Counter-narcotics report\n\nCoordinated task force disrupted supply chains across Antwerp and Rotterdam ports.",
    "utf8"
  );

  const config: AppConfig = {
    roots: { roots: [tmpRoot], include: [".md"], exclude: [] },
    index: {
      chunkSize: 350,
      chunkOverlap: 40,
      ocrEnabled: false,
      ocrTriggerMinChars: 0,
      useSQLiteVSS: false,
      model: "test",
    },
    out: { dataDir },
  };

  const store = new KnowledgeStore(config);
  await store.load();

  return {
    store,
    filePath,
    dataDir,
    cleanup: async () => {
      await fs.rm(tmpRoot, { recursive: true, force: true });
    },
  };
}

describe("KnowledgeStore reindex workflow", () => {
  let env: TestEnv;

  beforeEach(async () => {
    env = await createEnv();
    embedTextMock.mockClear();
  });

  afterEach(async () => {
    await env.cleanup();
  });

  it("indexes a new Markdown file and persists hybrid artefacts", async () => {
    const stats = await env.store.reindex([env.filePath]);
    expect(stats.updated).toBe(1);
    expect(stats.indexed).toBeGreaterThan(0);
    expect(embedTextMock).toHaveBeenCalledTimes(stats.indexed);

    const manifestRaw = JSON.parse(await fs.readFile(path.join(env.dataDir, "manifest.json"), "utf8"));
    expect(manifestRaw.files[env.filePath].chunkIds.length).toBe(stats.indexed);
    expect(manifestRaw.byType.markdown).toBe(stats.indexed);
    expect(manifestRaw.embeddingsCached).toBe(stats.indexed);

    const chunksRaw = JSON.parse(await fs.readFile(path.join(env.dataDir, "chunks.json"), "utf8"));
    expect(chunksRaw).toHaveLength(stats.indexed);
    expect(chunksRaw[0]?.path).toBe(env.filePath);

    const denseHits = env.store.searchDense(Float32Array.from([1, 1, 1]), 1);
    expect(denseHits[0]?.chunk.path).toBe(env.filePath);

    const keywordHits = env.store.searchKeyword("Antwerp", 1);
    expect(keywordHits[0]?.chunk.path).toBe(env.filePath);

    const manifest = env.store.getManifest();
    expect(manifest.chunks).toBe(env.store.listChunks().length);
    expect(manifest.lastIndexedAt).toBeGreaterThan(0);
  });

  it("skips unchanged files and reindexes when modified", async () => {
    await env.store.reindex([env.filePath]);
    embedTextMock.mockClear();

    const skipStats = await env.store.reindex([env.filePath]);
    expect(skipStats.updated).toBe(0);
    expect(skipStats.indexed).toBe(0);
    expect(skipStats.skipped).toBe(1);
    expect(embedTextMock).not.toHaveBeenCalled();

    await new Promise((resolve) => setTimeout(resolve, 10));
    await fs.writeFile(env.filePath, "# Counter-narcotics report\n\nExpanded intelligence summary and new findings.", "utf8");

    const updateStats = await env.store.reindex([env.filePath]);
    expect(updateStats.updated).toBe(1);
    expect(updateStats.indexed).toBeGreaterThan(0);
    expect(embedTextMock).toHaveBeenCalled();

    const manifest = env.store.getManifest();
    expect(manifest.files[env.filePath].partial).toBe(false);
  });
});
