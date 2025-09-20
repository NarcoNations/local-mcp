import { promises as fs } from "fs";
import { chunkText, normalizeText } from "../pipeline/chunk.js";
import { Chunk } from "../types.js";
import { IndexerArgs } from "./types.js";

export async function indexText({ filePath, mtime, config }: IndexerArgs): Promise<Chunk[]> {
  const raw = await fs.readFile(filePath, "utf8");
  const content = normalizeText(raw);
  return chunkText(content, {
    path: filePath,
    type: "text",
    size: config.index.chunkSize,
    overlap: config.index.chunkOverlap,
    mtime,
  });
}
