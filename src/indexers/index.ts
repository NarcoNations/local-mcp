import path from "path";
import { promises as fs } from "fs";
import { AppConfig } from "../types.js";
import { indexPdf } from "./pdf.js";
import { indexMarkdown } from "./markdown.js";
import { indexText } from "./text.js";
import { indexWord } from "./word.js";
import { indexPages } from "./pages.js";
import { IndexContext, IndexResult } from "./types.js";

const INDEXERS: Record<string, (ctx: IndexContext) => Promise<IndexResult>> = {
  ".pdf": indexPdf,
  ".md": indexMarkdown,
  ".markdown": indexMarkdown,
  ".txt": indexText,
  ".docx": indexWord,
  ".pages": indexPages,
};

export async function indexPath(absolutePath: string, relativePath: string, config: AppConfig): Promise<IndexResult> {
  const ext = path.extname(absolutePath).toLowerCase();
  const stat = await fs.stat(absolutePath);
  const maxBytes = (config.index.maxFileSizeMB ?? 200) * 1024 * 1024;
  if (stat.size > maxBytes) {
    return { chunks: [], warnings: [`file-too-large:${relativePath}`], partial: true };
  }
  const indexer = INDEXERS[ext];
  if (!indexer) {
    return { chunks: [], warnings: [`unsupported-extension:${ext}`], partial: true };
  }
  return indexer({
    absolutePath,
    relativePath,
    config,
    mtime: stat.mtimeMs,
  });
}
