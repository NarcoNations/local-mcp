import { promises as fs } from "fs";
import { tmpdir } from "os";
import path from "path";
import { afterAll, describe, expect, test, vi } from "vitest";

vi.mock("../src/pipeline/embed", () => ({
  embedText: vi.fn(async (text: string) => new Float32Array([text.length || 1, 1])),
  onModelStatus: vi.fn(),
}));

import { ResearchStore } from "../src/store/store.js";
import type { AppConfig } from "../src/config.js";
import { handleImportChatGPT } from "../src/tools/importChatGPT.js";

const cleanupDirs: string[] = [];

afterAll(async () => {
  await Promise.all(cleanupDirs.map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

describe("import_chatgpt_export tool", () => {
  test("converts export and reindexes", async () => {
    const base = await fs.mkdtemp(path.join(tmpdir(), "chatgpt-tool-"));
    cleanupDirs.push(base);
    const docsDir = path.join(base, "docs");
    const dataDir = path.join(base, "data");
    await fs.mkdir(docsDir, { recursive: true });
    const config: AppConfig = {
      roots: { roots: [docsDir], include: [".md"], exclude: [] },
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
      out: { dataDir },
    };

    const store = new ResearchStore(config);
    await store.ready();

    const summary = await handleImportChatGPT(store, {
      exportPath: path.join(process.cwd(), "fixtures", "chatgpt-export-sample"),
      outDir: path.join(docsDir, "chatgpt"),
    });

    expect(summary.filesWritten).toBeGreaterThan(0);
    const results = await store.search("hello", { k: 1, alpha: 0.5 });
    expect(results.length).toBeGreaterThan(0);
  });
});
