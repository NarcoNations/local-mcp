import { promises as fs } from "node:fs";
import mammoth from "mammoth";
import type { AppConfig, Chunk } from "../types.js";
import { chunkText } from "../pipeline/chunk.js";
import { normalizeForIndex } from "../utils/fs-guard.js";

export async function indexWord(filePath: string, config: AppConfig): Promise<Chunk[]> {
  const stat = await fs.stat(filePath);
  const { value } = await mammoth.extractRawText({ path: filePath });
  return chunkText(value, {
    path: normalizeForIndex(filePath),
    type: "word",
    mtime: stat.mtimeMs,
    chunkSize: config.index.chunkSize,
    chunkOverlap: config.index.chunkOverlap,
  });
}
