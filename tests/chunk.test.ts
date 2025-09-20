import { describe, expect, it } from "vitest";
import { buildChunks } from "../src/pipeline/chunk.js";

describe("chunking", () => {
  it("splits long text into overlapping chunks", () => {
    const text = Array.from({ length: 40 })
      .map((_, i) => `Paragraph ${i + 1} discussing Antwerp cocaine port dynamics.`)
      .join("\n\n");
    const chunks = buildChunks(text, {
      path: "virtual/sample.txt",
      type: "text",
      chunkSize: 200,
      chunkOverlap: 40,
      mtime: Date.now()
    });
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.text.length).toBeLessThanOrEqual(200);
      expect(chunk.offsetStart).toBeGreaterThanOrEqual(0);
      expect(chunk.offsetEnd).toBeGreaterThan(chunk.offsetStart ?? 0);
    }
  });
});
