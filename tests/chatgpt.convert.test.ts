import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import { convertChatGPTExport } from "../src/utils/chatgpt.js";

const EXPORT_FIXTURE = path.join(process.cwd(), "fixtures", "chatgpt-export-sample");
const OUTPUT_DIR = path.join(process.cwd(), "tmp-chatgpt-md");

describe("chatgpt-export converter", () => {
  beforeEach(async () => {
    await fs.rm(OUTPUT_DIR, { recursive: true, force: true });
  });

  afterEach(async () => {
    await fs.rm(OUTPUT_DIR, { recursive: true, force: true });
  });

  it("creates markdown files", async () => {
    await convertChatGPTExport(EXPORT_FIXTURE, OUTPUT_DIR);
    const files = await fs.readdir(OUTPUT_DIR);
    expect(files.length).toBe(1);
    const content = await fs.readFile(path.join(OUTPUT_DIR, files[0]), "utf8");
    expect(content).toContain("Sample Conversation");
    expect(content).toContain("Hello assistant");
  });
});
