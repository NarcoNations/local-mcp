import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import os from "os";
import path from "path";
import { promises as fs } from "fs";
import type { AppConfig } from "../src/config.js";
import type { Store } from "../src/store/store.js";

const watchers: Array<{
  on: (event: string, handler: (...args: any[]) => void) => any;
  emit: (event: string, ...args: any[]) => void;
}> = [];

const watchMock = vi.fn(
  () => {
    const listeners = new Map<string, (...args: any[]) => void>();
    const watcher = {
      on: (event: string, handler: (...args: any[]) => void) => {
        listeners.set(event, handler);
        return watcher;
      },
      emit: (event: string, ...args: any[]) => {
        const listener = listeners.get(event);
        if (listener) listener(...args);
      }
    };
    watchers.push(watcher);
    return watcher;
  }
);

vi.mock("chokidar", () => ({
  default: {
    watch: watchMock
  }
}));

vi.mock("@xenova/transformers", () => ({
  pipeline: async () => async () => ({ data: new Float32Array([1, 0, 0, 0]) })
}));

vi.mock("../src/utils/logger.js", () => ({
  info: vi.fn(),
  debug: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}));

describe("watch tool", () => {
  let tempRoot: string;

  beforeEach(async () => {
    watchers.length = 0;
    watchMock.mockClear();
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "mcp-nn-watch-"));
  });

  afterEach(async () => {
    await fs.rm(tempRoot, { recursive: true, force: true });
    vi.useRealTimers();
  });

  it("debounces rapid change events", async () => {
    vi.useFakeTimers();
    const storeModule = await import("../src/store/store.js");
    const reindexSpy = vi
      .spyOn(storeModule, "reindexPaths")
      .mockResolvedValue({ indexed: 0, updated: 0, skipped: 0 });
    const { createWatchTool } = await import("../src/tools/watch.js");

    const config = {
      roots: { roots: [tempRoot], include: [".md"], exclude: [] },
      index: {
        chunkSize: 3500,
        chunkOverlap: 120,
        ocrEnabled: true,
        ocrTriggerMinChars: 100,
        useSQLiteVSS: false,
        model: "Xenova/all-MiniLM-L6-v2",
        maxFileSizeMB: 200,
        concurrency: 2,
        languages: ["eng"]
      },
      out: { dataDir: path.join(tempRoot, ".mcp-nn") }
    } satisfies AppConfig;

    const store = {
      getConfig: () => config,
      removeFile: vi.fn(async () => {})
    } as unknown as Store;

    const events: Record<string, unknown>[] = [];
    const tool = createWatchTool(store, (event) => events.push(event));
    await tool.handler({ paths: [tempRoot] });

    expect(watchMock).toHaveBeenCalledTimes(1);
    expect(watchers).toHaveLength(1);

    const watcher = watchers[0];
    const filePath = path.join(tempRoot, "note.md");
    await fs.writeFile(filePath, "content", "utf8");

    watcher.emit("change", filePath);
    watcher.emit("change", filePath);

    await vi.advanceTimersByTimeAsync(260);

    const expectedRelative = path.relative(process.cwd(), path.resolve(filePath));
    await vi.waitFor(() => expect(reindexSpy).toHaveBeenCalledTimes(1));
    expect(reindexSpy).toHaveBeenCalledWith(store, [expectedRelative]);
    expect(events.filter((event) => event.action === "change")).toHaveLength(2);
  });
});
