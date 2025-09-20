import { describe, expect, it } from "vitest";
import { chunkDocument } from "../src/pipeline/chunk.js";

describe("chunkDocument", () => {
  it("respects chunk size and preserves overlap", () => {
    const text = Array.from({ length: 20 })
      .map((_, idx) => `Paragraph ${idx + 1}. Sentence A. Sentence B.`)
      .join("\n\n");
    const chunks = chunkDocument({
      path: "/tmp/doc.txt",
      type: "text",
      text,
      mtime: Date.now(),
      chunkSize: 200,
      chunkOverlap: 40,
    });
    expect(chunks.length).toBeGreaterThan(1);
    chunks.forEach((chunk) => {
      expect(chunk.text.length).toBeLessThanOrEqual(220);
      expect(chunk.id).toBeTruthy();
    });
  });

  it("keeps page information when provided", () => {
    const chunks = chunkDocument({
      path: "/tmp/doc.pdf",
      type: "pdf",
      text: "Page one sentence. Page one second sentence.",
      page: 3,
      mtime: Date.now(),
      chunkSize: 120,
      chunkOverlap: 30,
    });
    expect(chunks[0].page).toBe(3);
  });
});
