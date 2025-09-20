import path from "path";
import type { Chunk } from "../types.js";
import type { IndexerArgs, IndexerFn } from "./types.js";
import { indexMarkdown } from "./markdown.js";
import { indexPdf } from "./pdf.js";
import { indexPages } from "./pages.js";
import { indexText } from "./text.js";
import { indexWord } from "./word.js";

const indexers: Record<string, IndexerFn> = {
  ".pdf": indexPdf,
  ".md": indexMarkdown,
  ".markdown": indexMarkdown,
  ".txt": indexText,
  ".docx": indexWord,
  ".pages": indexPages,
};

export function getIndexer(filePath: string): IndexerFn {
  const ext = path.extname(filePath).toLowerCase();
  const indexer = indexers[ext];
  if (!indexer) {
    throw new Error(`No indexer for extension ${ext}`);
  }
  return indexer;
}

export async function runIndexer(args: IndexerArgs): Promise<Chunk[]> {
  const indexer = getIndexer(args.filePath);
  return indexer(args);
}
