import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import AdmZip from "adm-zip";
import { convertWithMdWorker } from "../src/ingest/mdConvert.js";
import type { AppConfig } from "../src/config.js";

const { reindexMock, getStoreMock } = vi.hoisted(() => {
  const reindex = vi.fn(async () => ({ indexed: 3, updated: 1, skipped: 0 }));
  const getStore = vi.fn(async () => ({ reindex }));
  return { reindexMock: reindex, getStoreMock: getStore };
});

vi.mock("../src/store/store.js", () => ({
  getStore: getStoreMock,
}));

const originalFetch = globalThis.fetch;

describe("convertWithMdWorker", () => {
  let tempRoot: string;
  let docsDir: string;

  beforeEach(async () => {
    reindexMock.mockClear();
    getStoreMock.mockClear();
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "md-convert-"));
    docsDir = path.join(tempRoot, "docs");
    await fs.mkdir(docsDir, { recursive: true });
    process.env.MD_CONVERT_URL = "https://md.example";
  });

  afterEach(async () => {
    await fs.rm(tempRoot, { recursive: true, force: true }).catch(() => {});
    if (originalFetch) {
      globalThis.fetch = originalFetch;
    }
    delete process.env.MD_CONVERT_URL;
  });

  it("writes markdown with frontmatter, updates manifest, and triggers reindex", async () => {
    const sourcePath = path.join(docsDir, "sample.pdf");
    await fs.writeFile(sourcePath, Buffer.from("PDF bytes"));

    const config: AppConfig = {
      roots: { roots: [docsDir], include: [".pdf", ".md"], exclude: [] },
      index: {
        chunkSize: 1200,
        chunkOverlap: 120,
        ocrEnabled: false,
        ocrTriggerMinChars: 50,
        useSQLiteVSS: false,
        model: "test-model",
      },
      out: { dataDir: path.join(tempRoot, ".mcp") },
    };

    const manifest = {
      id: "doc-123",
      slug: "converted-doc",
      title: "Converted Doc",
      tags: ["research"],
      source: { filename: "sample.pdf", ext: "pdf" },
      provenance: { converted_at: "2025-01-01T00:00:00Z" },
    };

    const zip = new AdmZip();
    zip.addFile("converted-doc/manifest.json", Buffer.from(JSON.stringify(manifest, null, 2)));
    zip.addFile("converted-doc/converted-doc.md", Buffer.from("# Heading\n\nBody text."));
    zip.addFile("converted-doc/assets/image.png", Buffer.from([1, 2, 3, 4]));
    const zipBuffer = zip.toBuffer();

    const mockFetch = vi.fn(async () => new Response(new Uint8Array(zipBuffer), { status: 200 }));
    globalThis.fetch = mockFetch as unknown as typeof fetch;

    const result = await convertWithMdWorker(config, {
      path: sourcePath,
      tags: ["briefing"],
      origin: "upload",
      outDir: path.join(docsDir, "converted"),
    });

    expect(mockFetch).toHaveBeenCalledWith("https://md.example/convert", expect.any(Object));
    expect(result.slug).toBe("converted-doc");
    expect(result.filesWritten).toBeGreaterThanOrEqual(3);
    expect(Array.isArray(result.assets)).toBe(true);

    const markdownAbs = path.resolve(process.cwd(), result.markdownPath);
    const markdownContent = await fs.readFile(markdownAbs, "utf8");
    expect(markdownContent.startsWith("---")).toBe(true);
    expect(markdownContent).toContain("id: doc-123");
    expect(markdownContent).toContain("tags:");
    expect(markdownContent).toContain("content_type: text/markdown");

    const manifestAbs = result.manifestPath ? path.resolve(process.cwd(), result.manifestPath) : null;
    expect(manifestAbs).not.toBeNull();
    if (manifestAbs) {
      const stored = JSON.parse(await fs.readFile(manifestAbs, "utf8"));
      expect(stored.tags).toContain("briefing");
      expect(stored.source.origin).toBe("upload");
    }

    expect(reindexMock).toHaveBeenCalledWith([path.join(docsDir, "converted")]);
  });
});
