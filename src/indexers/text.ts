import { promises as fs } from "fs";
import { chunkText } from "../pipeline/chunk.js";
import { chunkId } from "../utils/hash.js";
import { IndexContext, IndexResult } from "./types.js";

export const indexText = async (context: IndexContext): Promise<IndexResult> => {
  const { absolutePath, relativePath, config, mtime } = context;
  const raw = await fs.readFile(absolutePath, "utf8");
  const fragments = chunkText(raw, {
    chunkSize: config.index.chunkSize,
    chunkOverlap: config.index.chunkOverlap,
  });
  const chunks = fragments.map((fragment) => ({
    id: chunkId(relativePath, undefined, fragment.start),
    path: relativePath,
    type: "text" as const,
    offsetStart: fragment.start,
    offsetEnd: fragment.end,
    text: fragment.text,
    mtime,
  }));
  return { chunks, warnings: [] };
};
