import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import path from "path";
import os from "os";
import { promises as fs } from "fs";

vi.mock("pdf-parse", () => ({
  default: async (_buffer: ArrayBuffer, options: any) => {
    if (options?.pagerender) {
      await options.pagerender({
        getTextContent: async () => ({ items: [] }),
      });
    }
    return {};
  },
}));

vi.mock("../src/pipeline/embed.js", () => ({
  getEmbeddingService: () => ({
    embed: async (text: string) => {
      const words = text.split(/\s+/);
      const dimension = 32;
      const vector = new Float32Array(dimension);
      words.forEach((word, idx) => {
        const value = word.length % 7;
        vector[idx % dimension] += value;
      });
      const norm = Math.hypot(...vector);
      if (norm) {
        for (let i = 0; i < vector.length; i++) {
          vector[i] = vector[i] / norm;
        }
      }
      return vector;
    },
  }),
}));

import { reindexPaths, searchHybrid } from "../src/store/store.js";

const tempDataDir = path.join(os.tmpdir(), `mcp-nn-test-${Date.now()}`);
const tempDocsDir = path.join(tempDataDir, "docs");

beforeAll(async () => {
  await fs.mkdir(tempDocsDir, { recursive: true });
  process.env.MCP_NN_DATA_DIR = tempDataDir;
  process.env.MCP_NN_ROOTS = tempDocsDir;
  const filePath = path.join(tempDocsDir, "intel.txt");
  await fs.writeFile(
    filePath,
    [
      "Antwerp port is a critical hub in the European cocaine supply chain.",
      "Law enforcement monitors containers using risk scores and historical intel.",
      "NarcoNations research catalogues seizures across terminals.",
    ].join(" \n")
  );
  await reindexPaths([filePath]);
});

afterAll(async () => {
  delete process.env.MCP_NN_DATA_DIR;
  delete process.env.MCP_NN_ROOTS;
});

describe("store search", () => {
  it("returns hybrid search results", async () => {
    const results = await searchHybrid({ query: "Antwerp port cocaine", k: 3, alpha: 0.5 });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].citation.filePath).toContain("intel.txt");
  });
});
