import { promises as fs } from "fs";
import { tmpdir } from "os";
import path from "path";
import AdmZip from "adm-zip";
import { describe, expect, test } from "vitest";
import { indexPages } from "../src/indexers/pages.js";

const chunkOptions = { chunkSize: 1200, chunkOverlap: 0 };

describe("pages indexer", () => {
  test("marks modern .pages bundles as partial", async () => {
    const dir = await fs.mkdtemp(path.join(tmpdir(), "pages-test-"));
    const filePath = path.join(dir, "test.pages");
    const zip = new AdmZip();
    zip.addFile("Data/document.iwa", Buffer.from("stub"));
    await fs.writeFile(filePath, zip.toBuffer());

    const result = await indexPages(filePath, Date.now(), chunkOptions);
    expect(result.partial).toBe(true);
  });
});
