import { describe, it, expect } from "vitest";
import os from "os";
import path from "path";
import { promises as fs } from "fs";
import AdmZip from "adm-zip";
import { indexPages } from "../src/indexers/pages.js";
import type { AppConfig } from "../src/types.js";

const baseConfig: AppConfig = {
  roots: {
    roots: [process.cwd()],
    include: [".pages"],
    exclude: [],
  },
  index: {
    chunkSize: 500,
    chunkOverlap: 0,
    ocrEnabled: false,
    ocrTriggerMinChars: 100,
    useSQLiteVSS: false,
    model: "Xenova/all-MiniLM-L6-v2",
    maxFileSizeMB: 10,
    concurrency: 1,
    languages: ["eng"],
  },
  out: { dataDir: ".mcp-nn" },
};

describe("indexPages", () => {
  it("returns chunks when XML is present", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "pages-"));
    const filePath = path.join(dir, "doc.pages");
    const zip = new AdmZip();
    zip.addFile("index.xml", Buffer.from("<document><body><p>Antwerp cocaine port report</p></body></document>", "utf8"));
    zip.writeZip(filePath);

    const chunks = await indexPages({ filePath, mtime: Date.now(), config: baseConfig });
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].text).toContain("Antwerp cocaine port report");
  });

  it("handles modern pages archives without crashing", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "pages-"));
    const filePath = path.join(dir, "empty.pages");
    const zip = new AdmZip();
    zip.addFile("Data/Document.iwa", Buffer.from("test"));
    zip.writeZip(filePath);

    const chunks = await indexPages({ filePath, mtime: Date.now(), config: baseConfig });
    expect(chunks).toEqual([]);
  });
});
