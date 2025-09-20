import { promises as fs } from "fs";
import matter from "gray-matter";
import { IndexFileResult } from "../types.js";
import { ChunkOptions, chunkSource } from "../pipeline/chunk.js";
import { hashContent } from "../utils/hash.js";

export async function indexMarkdown(filePath: string, mtime: number, options: ChunkOptions): Promise<IndexFileResult> {
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = matter(raw);
  const tags: string[] | undefined = Array.isArray(parsed.data?.tags)
    ? parsed.data.tags.map((t: unknown) => String(t))
    : undefined;
  const text = `${parsed.data?.title ? `# ${parsed.data.title}\n\n` : ""}${parsed.content}`;
  const chunks = chunkSource({ path: filePath, type: "markdown", text, mtime, tags }, options);
  const fileHash = hashContent(raw);
  return { chunks, fullText: text, tags, fileHash };
}
