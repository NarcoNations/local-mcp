import { describe, expect, test } from "vitest";
import { chunkSource, computeChunkHash } from "../src/pipeline/chunk.js";

const options = { chunkSize: 50, chunkOverlap: 10 };

describe("chunkSource", () => {
  test("splits text into overlapping chunks", () => {
    const text = Array.from({ length: 5 })
      .map((_, idx) => `Paragraph ${idx + 1} line alpha bravo charlie delta echo.`)
      .join("\n\n");
    const chunks = chunkSource({ path: "doc.txt", type: "text", text, mtime: Date.now() }, options);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.text.length).toBeLessThanOrEqual(options.chunkSize + 5);
      expect(chunk.offsetStart).toBeLessThan((chunk.offsetEnd ?? 0) + 1);
    }
  });

  test("produces stable hashes for identical chunks", () => {
    const text = "alpha bravo charlie";
    const [chunk] = chunkSource({ path: "doc.txt", type: "text", text, mtime: 100 }, options);
    const hash1 = computeChunkHash(chunk);
    const hash2 = computeChunkHash({ ...chunk });
    expect(hash1).toEqual(hash2);
  });
});
