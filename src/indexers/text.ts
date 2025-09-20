import { promises as fs } from "fs";
import { IndexFileResult } from "../types.js";
import { hashContent } from "../utils/hash.js";
import { ChunkOptions, chunkSource } from "../pipeline/chunk.js";

export async function indexText(filePath: string, mtime: number, options: ChunkOptions): Promise<IndexFileResult> {
  const text = await fs.readFile(filePath, "utf8");
  const chunks = chunkSource({ path: filePath, type: "text", text, mtime }, options);
  const fileHash = hashContent(text);
  return { chunks, fullText: text, fileHash };
}
