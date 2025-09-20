import { describe, it, expect } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { convertChatGPTExport } from "../scripts/chatgpt-export-to-md.ts";

describe("chatgpt export converter", () => {
  it("writes markdown files with metadata", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "chatgpt-md-"));
    const exportPath = path.join(process.cwd(), "fixtures", "chatgpt-export-sample");
    const result = await convertChatGPTExport(exportPath, tempDir);
    expect(result.filesWritten).toBeGreaterThan(0);
    const files = await fs.readdir(tempDir);
    const content = await fs.readFile(path.join(tempDir, files[0]), "utf8");
    expect(content).toContain("Sample Chat");
    expect(content).toContain('source: "chatgpt-export"');
  });
});
