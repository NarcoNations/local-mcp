import { promises as fs } from "node:fs";
import matter from "gray-matter";
import type { AppConfig, Chunk } from "../types.js";
import { chunkText } from "../pipeline/chunk.js";
import { normalizeForIndex } from "../utils/fs-guard.js";

export async function indexMarkdown(filePath: string, config: AppConfig): Promise<Chunk[]> {
  const stat = await fs.stat(filePath);
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = matter(raw);
  const tags = Array.isArray(parsed.data?.tags)
    ? (parsed.data.tags as unknown[]).map(String)
    : parsed.data?.tags
    ? String(parsed.data.tags)
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : undefined;

  const normalizedPath = normalizeForIndex(filePath);
  const chunks = chunkText(parsed.content, {
    path: normalizedPath,
    type: "markdown",
    mtime: stat.mtimeMs,
    chunkSize: config.index.chunkSize,
    chunkOverlap: config.index.chunkOverlap,
    tags,
  });

  return chunks;
}
