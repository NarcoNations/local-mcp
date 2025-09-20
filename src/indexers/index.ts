import { promises as fs } from "fs";
import path from "path";
import { AppConfig } from "../config.js";
import { Chunk, ChunkType } from "../types.js";
import { warn } from "../utils/logger.js";
import { indexMarkdown } from "./markdown.js";
import { indexPdf } from "./pdf.js";
import { indexText } from "./text.js";
import { indexWord } from "./word.js";
import { indexPages } from "./pages.js";

function detectType(ext: string): ChunkType {
  switch (ext) {
    case ".pdf":
      return "pdf";
    case ".md":
    case ".markdown":
      return "markdown";
    case ".txt":
    case ".text":
      return "text";
    case ".docx":
      return "word";
    case ".pages":
      return "pages";
    default:
      throw new Error(`Unsupported file extension: ${ext}`);
  }
}

export interface IndexedFile {
  chunks: Chunk[];
  size: number;
  mtime: number;
  type: ChunkType;
  partial: boolean;
}

export async function indexFile(filePath: string, config: AppConfig): Promise<IndexedFile> {
  const stat = await fs.stat(filePath);
  const sizeMb = stat.size / (1024 * 1024);
  const limit = config.index.maxFileSizeMB ?? 200;
  if (sizeMb > limit) {
    warn("file-skip-max-size", { path: filePath, sizeMb, limit });
    return { chunks: [], size: stat.size, mtime: stat.mtimeMs, type: detectType(path.extname(filePath).toLowerCase()), partial: true };
  }
  const mtime = stat.mtimeMs;
  const ext = path.extname(filePath).toLowerCase();
  const type = detectType(ext);
  let chunks: Chunk[] = [];
  switch (type) {
    case "pdf":
      chunks = await indexPdf(filePath, config, mtime);
      break;
    case "markdown":
      chunks = await indexMarkdown(filePath, config, mtime);
      break;
    case "text":
      chunks = await indexText(filePath, config, mtime);
      break;
    case "word":
      chunks = await indexWord(filePath, config, mtime);
      break;
    case "pages":
      chunks = await indexPages(filePath, config, mtime);
      break;
  }
  const partial = chunks.some((chunk) => chunk.partial === true);
  return { chunks, size: stat.size, mtime, type, partial };
}
