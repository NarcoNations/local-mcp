import mammoth from "mammoth";
import { chunkText } from "../pipeline/chunk.js";
import { chunkId } from "../utils/hash.js";
import { IndexContext, IndexResult } from "./types.js";

export const indexWord = async (context: IndexContext): Promise<IndexResult> => {
  const { absolutePath, relativePath, config, mtime } = context;
  const result = await mammoth.extractRawText({ path: absolutePath });
  const fragments = chunkText(result.value || "", {
    chunkSize: config.index.chunkSize,
    chunkOverlap: config.index.chunkOverlap,
  });

  const chunks = fragments.map((fragment) => ({
    id: chunkId(relativePath, undefined, fragment.start),
    path: relativePath,
    type: "word" as const,
    offsetStart: fragment.start,
    offsetEnd: fragment.end,
    text: fragment.text,
    mtime,
  }));

  return { chunks, warnings: result.messages?.map((msg) => msg.message) ?? [] };
};
