import { describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "fs";
import path from "path";
import os from "os";
import { spawnSync } from "child_process";

describe("chatgpt export conversion", () => {
  it("converts sample export to markdown", () => {
    const outDir = mkdtempSync(path.join(os.tmpdir(), "chatgpt-md-"));
    const script = path.join(process.cwd(), "scripts", "chatgpt-export-to-md.ts");
    const result = spawnSync(
      process.execPath,
      ["--loader", "ts-node/esm", script, "--", path.resolve("fixtures/chatgpt-export-sample"), outDir],
      {
        encoding: "utf8"
      }
    );
    if (result.status !== 0) {
      throw new Error(result.stderr || "conversion failed");
    }
    const files = readdirSync(outDir);
    expect(files.length).toBeGreaterThan(0);
    const doc = readFileSync(path.join(outDir, files[0]), "utf8");
    expect(doc).toContain("Antwerp");
    rmSync(outDir, { recursive: true, force: true });
  });
});
