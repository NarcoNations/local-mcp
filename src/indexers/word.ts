import mammoth from "mammoth";
import { chunkText } from "../pipeline/chunk.js";
import { Chunk } from "../types.js";
import { IndexerArgs } from "./types.js";

export async function indexWord({ filePath, mtime, config }: IndexerArgs): Promise<Chunk[]> {
  const result = await mammoth.extractRawText({ path: filePath });
  const text = result.value ?? "";
  return chunkText(text, {
    path: filePath,
    type: "word",
    size: config.index.chunkSize,
    overlap: config.index.chunkOverlap,
    mtime,
  });
}
