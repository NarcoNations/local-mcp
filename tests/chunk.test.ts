import { describe, it, expect } from "vitest";
import { chunkText } from "../src/pipeline/chunk.js";

const sampleText = Array.from({ length: 20 })
  .map((_, idx) => `Paragraph ${idx + 1}: Antwerp port security operations and cocaine interdiction details.`)
  .join("\n\n");

describe("chunkText", () => {
  it("splits large text into stable chunk ids with overlap", () => {
    const chunksA = chunkText(sampleText, {
      path: "/docs/sample.txt",
      type: "text",
      size: 200,
      overlap: 40,
      mtime: Date.now(),
    });
    const chunksB = chunkText(sampleText, {
      path: "/docs/sample.txt",
      type: "text",
      size: 200,
      overlap: 40,
      mtime: Date.now(),
    });

    expect(chunksA.length).toBeGreaterThan(1);
    expect(chunksA[0].offsetStart).toBe(0);
    expect(chunksA[0].text.length).toBeLessThanOrEqual(200 + 40);
    expect(chunksA.map(chunk => chunk.id)).toEqual(chunksB.map(chunk => chunk.id));
  });
});
