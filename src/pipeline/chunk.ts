import { chunkId } from "../utils/hash.js";
import type { Chunk, ChunkType } from "../types.js";

export interface ChunkOptions {
  path: string;
  type: ChunkType;
  page?: number;
  mtime: number;
  tags?: string[];
  partial?: boolean;
  chunkSize: number;
  chunkOverlap: number;
}

function sentenceSegments(text: string): string[] {
  if (typeof (Intl as any).Segmenter === "function") {
    const segmenter = new (Intl as any).Segmenter(undefined, { granularity: "sentence" });
    const segments: string[] = [];
    for (const { segment } of segmenter.segment(text)) {
      segments.push(segment);
    }
    return segments;
  }
  return text.split(/(?<=[.!?])\s+/);
}

export function chunkText(text: string, options: ChunkOptions): Chunk[] {
  const normalized = text.normalize("NFKC").replace(/\s+/g, (match) => (match.includes("\n") ? "\n" : " ")).trim();
  if (!normalized) return [];

  const sentences = sentenceSegments(normalized);
  const { chunkSize, chunkOverlap } = options;
  const chunks: Chunk[] = [];
  let buffer = "";
  let offsetStart = 0;

  const pushChunk = (chunkTextValue: string, start: number, end: number) => {
    const id = chunkId(options.path, options.page, start, end);
    chunks.push({
      id,
      path: options.path,
      type: options.type,
      page: options.page,
      offsetStart: start,
      offsetEnd: end,
      text: chunkTextValue,
      mtime: options.mtime,
      tags: options.tags,
      partial: options.partial,
    });
  };

  for (const sentence of sentences) {
    const candidate = buffer ? `${buffer} ${sentence}`.trim() : sentence.trim();
    if (candidate.length <= chunkSize) {
      buffer = candidate;
      continue;
    }

    const end = offsetStart + buffer.length;
    if (buffer) {
      pushChunk(buffer, offsetStart, end);
      const overlap = chunkOverlap > 0 ? buffer.slice(Math.max(0, buffer.length - chunkOverlap)) : "";
      buffer = overlap ? `${overlap} ${sentence}`.trim() : sentence.trim();
      offsetStart = end - overlap.length;
    } else {
      pushChunk(candidate.slice(0, chunkSize), offsetStart, offsetStart + chunkSize);
      buffer = candidate.slice(Math.max(0, candidate.length - chunkOverlap));
      offsetStart += chunkSize - chunkOverlap;
    }
  }

  if (buffer) {
    const end = offsetStart + buffer.length;
    pushChunk(buffer, offsetStart, end);
  }

  return chunks;
}
