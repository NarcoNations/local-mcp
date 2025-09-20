import { promises as fs } from "fs";
import { tmpdir } from "os";
import path from "path";
import { describe, expect, test } from "vitest";
import { convertChatGPTExport } from "../src/chatgpt/convert.js";

describe("chatgpt export converter", () => {
  test("writes markdown files with metadata", async () => {
    const outDir = await fs.mkdtemp(path.join(tmpdir(), "chatgpt-out-"));
    const result = await convertChatGPTExport(path.join(process.cwd(), "fixtures", "chatgpt-export-sample"), outDir);
    expect(result.filesWritten).toBeGreaterThan(0);
    const files = await fs.readdir(outDir);
    expect(files.some((f) => f.endsWith(".md"))).toBe(true);
    const sample = await fs.readFile(path.join(outDir, files[0]), "utf8");
    expect(sample).toContain("source: \"chatgpt-export\"");
  });
});
