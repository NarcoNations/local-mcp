import mammoth from "mammoth";
import { chunkDocument } from "../pipeline/chunk.js";
import type { Chunk } from "../types.js";
import type { IndexConfig } from "../config.js";

export async function indexWord(filePath: string, mtime: number, cfg: IndexConfig): Promise<Chunk[]> {
  const res = await mammoth.extractRawText({ path: filePath });
  const text = res.value ?? "";
  return chunkDocument({
    path: filePath,
    type: "word",
    text,
    mtime,
    chunkSize: cfg.chunkSize,
    chunkOverlap: cfg.chunkOverlap,
  });
}
