import { describe, expect, it } from "vitest";
import { chunkText } from "../src/pipeline/chunk.js";

describe("chunkText", () => {
  it("splits text into overlapping windows without truncating sentences", () => {
    const text = `Paragraph one discusses Antwerp's role in European trafficking. Paragraph two expands on the logistics hub. Paragraph three considers enforcement gaps.`;
    const fragments = chunkText(text, { chunkSize: 60, chunkOverlap: 10 });
    expect(fragments.length).toBeGreaterThan(1);
    for (const fragment of fragments) {
      expect(fragment.text.length).toBeLessThanOrEqual(70);
      expect(fragment.start).toBeLessThan(fragment.end);
    }
    expect(fragments.map((f) => f.start)).toStrictEqual([...fragments.map((f) => f.start)].sort((a, b) => a - b));
  });
});
