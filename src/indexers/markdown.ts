import { promises as fs } from "fs";
import matter from "gray-matter";
import { chunkDocument } from "../pipeline/chunk.js";
import type { Chunk } from "../types.js";
import type { IndexConfig } from "../config.js";

export async function indexMarkdown(filePath: string, mtime: number, cfg: IndexConfig): Promise<Chunk[]> {
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = matter(raw);
  const tags: string[] | undefined = Array.isArray(parsed.data?.tags) ? parsed.data.tags.map((t: unknown) => String(t)) : undefined;
  return chunkDocument({
    path: filePath,
    type: "markdown",
    text: parsed.content,
    mtime,
    tags,
    chunkSize: cfg.chunkSize,
    chunkOverlap: cfg.chunkOverlap,
  });
}
