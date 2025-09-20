import { promises as fs } from "fs";
import matter from "gray-matter";
import { chunkText, normalizeText } from "../pipeline/chunk.js";
import { chunkId } from "../utils/hash.js";
import { IndexContext, IndexResult } from "./types.js";

export const indexMarkdown = async (context: IndexContext): Promise<IndexResult> => {
  const { absolutePath, relativePath, config, mtime } = context;
  const raw = await fs.readFile(absolutePath, "utf8");
  const parsed = matter(raw);
  const tagsValue = parsed.data?.tags;
  const tags = Array.isArray(tagsValue)
    ? tagsValue.map((tag) => String(tag))
    : tagsValue
    ? [String(tagsValue)]
    : [];

  const body = normalizeText(parsed.content || "");
  const fragments = chunkText(body, {
    chunkSize: config.index.chunkSize,
    chunkOverlap: config.index.chunkOverlap,
  });

  const chunks = fragments.map((fragment) => ({
    id: chunkId(relativePath, undefined, fragment.start),
    path: relativePath,
    type: "markdown" as const,
    offsetStart: fragment.start,
    offsetEnd: fragment.end,
    text: fragment.text,
    tags,
    mtime,
  }));

  return { chunks, warnings: [] };
};
