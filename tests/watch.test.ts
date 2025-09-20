import { promises as fs } from "fs";
import { tmpdir } from "os";
import path from "path";
import { afterAll, describe, expect, test, vi } from "vitest";

vi.mock("../src/pipeline/embed", () => ({
  embedText: vi.fn(async (text: string) => new Float32Array([text.length || 1, 1, 1])),
  onModelStatus: vi.fn(),
}));

import { ResearchStore } from "../src/store/store.js";
import type { AppConfig } from "../src/config.js";

const createdDirs: string[] = [];

afterAll(async () => {
  await Promise.all(createdDirs.map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

describe("watch integration", () => {
  test("emits events on file changes", async () => {
    const base = await fs.mkdtemp(path.join(tmpdir(), "mcp-watch-"));
    createdDirs.push(base);
    const docsDir = path.join(base, "docs");
    const dataDir = path.join(base, "data");
    await fs.mkdir(docsDir, { recursive: true });

    const config: AppConfig = {
      roots: { roots: [docsDir], include: [".txt"], exclude: [] },
      index: {
        chunkSize: 1000,
        chunkOverlap: 20,
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

    const events: { event: string; path: string }[] = [];
    const close = await store.watch([docsDir], (evt: { event: string; path: string }) => events.push(evt));

    await fs.writeFile(path.join(docsDir, "note.txt"), "Initial content");
    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(events.some((evt) => evt.event === "add")).toBe(true);

    await close();
  }, 10_000);
});
