import { promises as fs } from "fs";
import { AppConfig } from "../config.js";
import { buildChunks } from "../pipeline/chunk.js";
import { Chunk } from "../types.js";

export async function indexText(path: string, config: AppConfig, mtime: number): Promise<Chunk[]> {
  const raw = await fs.readFile(path, "utf8");
  return buildChunks(raw, {
    path,
    type: "text",
    chunkSize: config.index.chunkSize,
    chunkOverlap: config.index.chunkOverlap,
    mtime
  });
}
