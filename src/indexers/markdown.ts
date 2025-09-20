import { promises as fs } from "fs";
import matter from "gray-matter";
import { AppConfig } from "../config.js";
import { buildChunks } from "../pipeline/chunk.js";
import { Chunk } from "../types.js";

export async function indexMarkdown(path: string, config: AppConfig, mtime: number): Promise<Chunk[]> {
  const raw = await fs.readFile(path, "utf8");
  const parsed = matter(raw);
  const tags = Array.isArray(parsed.data?.tags)
    ? parsed.data.tags.map((tag: unknown) => String(tag))
    : parsed.data?.tags
    ? [String(parsed.data.tags)]
    : undefined;
  const content = parsed.content ?? "";
  return buildChunks(content, {
    path,
    type: "markdown",
    chunkSize: config.index.chunkSize,
    chunkOverlap: config.index.chunkOverlap,
    tags,
    mtime
  });
}
