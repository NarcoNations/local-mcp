import { promises as fs } from "fs";
import { chunkDocument } from "../pipeline/chunk.js";
import type { Chunk } from "../types.js";
import type { IndexConfig } from "../config.js";

export async function indexText(filePath: string, mtime: number, cfg: IndexConfig): Promise<Chunk[]> {
  const raw = await fs.readFile(filePath, "utf8");
  return chunkDocument({
    path: filePath,
    type: "text",
    text: raw,
    mtime,
    chunkSize: cfg.chunkSize,
    chunkOverlap: cfg.chunkOverlap,
  });
}
