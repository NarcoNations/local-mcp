import { describe, expect, it, beforeEach } from "vitest";
import { FlatVectorIndex } from "../src/store/vector-flat.js";

const DATA_DIR = ".mcp-nn-test";

function createVector(values: number[]): Float32Array {
  return Float32Array.from(values);
}

describe("FlatVectorIndex", () => {
  beforeEach(async () => {
    const fs = await import("fs/promises");
    await fs.rm(DATA_DIR, { recursive: true, force: true });
  });

  it("stores and searches vectors", async () => {
    const index = new FlatVectorIndex(DATA_DIR);
    await index.load();
    const vectors = new Map([
      ["a", createVector([1, 0, 0])],
      ["b", createVector([0, 1, 0])],
      ["c", createVector([0.5, 0.5, 0])],
    ]);
    await index.rebuild(vectors);

    const hits = index.search(createVector([0.9, 0.1, 0]), 2);
    expect(hits[0]?.id).toBe("a");
    expect(hits.length).toBe(2);
  });
});
