import { promises as fs } from "fs";
import mammoth from "mammoth";
import { IndexFileResult } from "../types.js";
import { ChunkOptions, chunkSource } from "../pipeline/chunk.js";
import { hashBuffer } from "../utils/hash.js";

export async function indexWord(filePath: string, mtime: number, options: ChunkOptions): Promise<IndexFileResult> {
  const buffer = await fs.readFile(filePath);
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value ?? "";
  const chunks = chunkSource({ path: filePath, type: "word", text, mtime }, options);
  const fileHash = hashBuffer(buffer);
  return { chunks, fullText: text, fileHash };
}
