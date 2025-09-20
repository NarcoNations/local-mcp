import { describe, it, expect } from "vitest";
import { chunkText } from "../src/pipeline/chunk.js";

describe("chunkText", () => {
  it("respects chunk boundaries and overlap", () => {
    const text = "Sentence one. Sentence two continues here. Sentence three follows.";
    const chunks = chunkText(text, {
      path: "docs/test.md",
      type: "markdown",
      mtime: Date.now(),
      chunkSize: 30,
      chunkOverlap: 10,
    });
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].text.length).toBeLessThanOrEqual(30 + 5);
    expect(chunks[1].offsetStart).toBeLessThan(chunks[1].offsetEnd!);
  });
});
