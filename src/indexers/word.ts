import mammoth from "mammoth";
import { AppConfig } from "../config.js";
import { buildChunks } from "../pipeline/chunk.js";
import { warn } from "../utils/logger.js";

export async function indexWord(path: string, config: AppConfig, mtime: number) {
  const result = await mammoth.extractRawText({ path });
  if (result.messages?.length) {
    for (const message of result.messages) {
      warn("word-warning", { path, message: message.message, type: message.type });
    }
  }
  return buildChunks(result.value || "", {
    path,
    type: "word",
    chunkSize: config.index.chunkSize,
    chunkOverlap: config.index.chunkOverlap,
    mtime
  });
}
