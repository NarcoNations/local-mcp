import { promises as fs } from "fs";
import matter from "gray-matter";
import { chunkText } from "../pipeline/chunk.js";
import { Chunk } from "../types.js";
import { IndexerArgs } from "./types.js";

export async function indexMarkdown({ filePath, mtime, config }: IndexerArgs): Promise<Chunk[]> {
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = matter(raw);
  const tags = Array.isArray(parsed.data?.tags)
    ? parsed.data.tags.map((t: unknown) => String(t))
    : undefined;
  const chunks = chunkText(parsed.content, {
    path: filePath,
    type: "markdown",
    page: undefined,
    tags,
    size: config.index.chunkSize,
    overlap: config.index.chunkOverlap,
    mtime,
  });
  for (const chunk of chunks) {
    if (tags && tags.length) chunk.tags = tags;
  }
  return chunks;
}
