import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { createHttpApp } from "../../src/http/app.js";

let tempDir: string;

beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "mcp-http-"));
  process.env.MCP_NN_DATA_DIR = tempDir;
  process.env.TRANSFORMERS_CACHE = path.join(tempDir, "transformers");
});

afterEach(async () => {
  delete process.env.MCP_NN_DATA_DIR;
  delete process.env.TRANSFORMERS_CACHE;
  await fs.rm(tempDir, { recursive: true, force: true });
});

describe("createHttpApp", () => {
  it("returns health status", async () => {
    const instance = await createHttpApp({ disableStatic: true });
    const response = await request(instance.app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    await instance.dispose();
  });

  it("keeps SSE connections open with the correct headers", async () => {
    const instance = await createHttpApp({ disableStatic: true });
    await new Promise<void>((resolve, reject) => {
      const req = request(instance.app).get("/api/logs/stream");
      req.set("accept", "text/event-stream");
      req.buffer(false);
      req.on("response", (res) => {
        try {
          expect(res.statusCode).toBe(200);
          expect(res.headers["content-type"]).toContain("text/event-stream");
          expect(res.headers["cache-control"]).toContain("no-cache");
          expect(res.headers.connection).toBe("keep-alive");
          resolve();
        } catch (error) {
          reject(error);
        }
      });
      req.on("error", reject);
      req.end();
    });
    await instance.dispose();
  });
});
