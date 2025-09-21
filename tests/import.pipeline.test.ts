import { describe, expect, test } from "vitest";
import path from "node:path";
import { importFile } from "../src/importers/index.js";
import { chunkSections } from "../src/core/chunking/chunker.js";
import { env } from "../src/config/env.js";

describe("import pipeline", () => {
  const corpusDir = path.resolve("fixtures/memory");

  test("markdown dossier creates slug and route hint", async () => {
    const [result] = await importFile(path.join(corpusDir, "dossier-amsterdam.md"));
    expect(result.document.slug).toBe("amsterdam");
    expect(result.document.routeHint).toBe("#/amsterdam");
    expect(result.sections).toHaveLength(3);
  });

  test("csv nodes map headers to node content type", async () => {
    const records = await importFile(path.join(corpusDir, "narconations_nodes_master.csv"));
    expect(records).not.toHaveLength(0);
    expect(records[0].document.contentType).toBe("node");
    expect(records[0].document.slug).toBe("antwerp-seaport");
  });

  test("chunker honours token limits", () => {
    const sections = [
      {
        heading: "Section",
        text: "This is a long paragraph repeated. ".repeat(100),
        order: 0,
      },
    ];
    const chunks = chunkSections(sections, { chunkTokens: 200, overlapTokens: 50 });
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].tokenCount).toBeLessThanOrEqual(200);
  });
});
