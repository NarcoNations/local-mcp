import { promises as fs } from "node:fs";
import type { AppConfig, Chunk } from "../types.js";
import { chunkText } from "../pipeline/chunk.js";
import { normalizeForIndex } from "../utils/fs-guard.js";

export async function indexText(filePath: string, config: AppConfig): Promise<Chunk[]> {
  const stat = await fs.stat(filePath);
  const raw = await fs.readFile(filePath, "utf8");
  return chunkText(raw, {
    path: normalizeForIndex(filePath),
    type: "text",
    mtime: stat.mtimeMs,
    chunkSize: config.index.chunkSize,
    chunkOverlap: config.index.chunkOverlap,
  });
}
