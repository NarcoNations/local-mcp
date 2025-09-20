import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EventEmitter } from "events";
import os from "os";
import path from "path";
import { promises as fs } from "fs";
import type { AppConfig } from "../src/config.js";
import type { Store } from "../src/store/store.js";

const spawnMock = vi.fn();

vi.mock("child_process", () => ({
  spawn: (...args: any[]) => spawnMock(...args)
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

describe("import_chatgpt_export tool", () => {
  let tempRoot: string;
  let config: AppConfig;
  let store: Store;

  beforeEach(async () => {
    vi.resetModules();
    spawnMock.mockReset();
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "mcp-nn-import-"));
    config = {
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
    store = {
      getConfig: () => config
    } as unknown as Store;

    spawnMock.mockImplementation(() => {
      const child = new EventEmitter() as EventEmitter & {
        stdout: EventEmitter;
        stderr: EventEmitter;
        kill: ReturnType<typeof vi.fn>;
      };
      child.stdout = new EventEmitter();
      child.stderr = new EventEmitter();
      child.kill = vi.fn();
      return child;
    });
  });

  afterEach(async () => {
    await fs.rm(tempRoot, { recursive: true, force: true });
  });

  it("converts exports and triggers reindex", async () => {
    const storeModule = await import("../src/store/store.js");
    const reindexSpy = vi
      .spyOn(storeModule, "reindexPaths")
      .mockResolvedValue({ indexed: 0, updated: 0, skipped: 0 });
    const { createImportChatGPTTool } = await import("../src/tools/importChatGPT.js");

    const events: Record<string, unknown>[] = [];
    const tool = createImportChatGPTTool(store, (event) => events.push(event));
    const exportPath = "/tmp/chatgpt-export";
    const outDir = path.join(tempRoot, "docs");
    await fs.mkdir(outDir, { recursive: true });

    const promise = tool.handler({ exportPath, outDir });
    await vi.waitFor(() => expect(spawnMock).toHaveBeenCalledTimes(1));
    const child = spawnMock.mock.results[0].value as EventEmitter & {
      stdout: EventEmitter;
    };

    const payload = {
      level: "info",
      msg: "chatgpt_export_converted",
      meta: { filesWritten: 3, conversations: 3 }
    };
    child.stdout.emit("data", Buffer.from(`${JSON.stringify(payload)}\n`));
    child.emit("close", 0);

    const result = await promise;
    const expectedOut = path.resolve(outDir);

    expect(result).toEqual({ filesWritten: 3, conversations: 3, outDir: expectedOut });
    expect(reindexSpy).toHaveBeenCalledWith(store, [expectedOut]);
    expect(events).toEqual([
      { event: "import", action: "start", outDir: expectedOut },
      { event: "import", action: "complete", outDir: expectedOut, filesWritten: 3 }
    ]);

    const tsNodeBin = path.join(process.cwd(), "node_modules", "ts-node", "dist", "bin.js");
    const scriptPath = path.join(process.cwd(), "scripts", "chatgpt-export-to-md.ts");
    expect(spawnMock).toHaveBeenCalledWith(
      process.execPath,
      [tsNodeBin, scriptPath, "--", exportPath, expectedOut],
      expect.objectContaining({ stdio: ["ignore", "pipe", "pipe"] })
    );
  });
});
