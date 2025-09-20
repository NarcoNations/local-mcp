import { createChunkId, hashChunkInput } from "../utils/hash.js";
import { Chunk, ChunkKind } from "../types.js";

export interface ChunkOptions {
  chunkSize: number;
  chunkOverlap: number;
}

export interface ChunkSource {
  path: string;
  type: ChunkKind;
  text: string;
  mtime: number;
  page?: number;
  tags?: string[];
  partial?: boolean;
}

function normalize(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\u0000/g, " ").normalize("NFKC");
}

function breakIntoParagraphs(text: string): string[] {
  const normalized = normalize(text).trim();
  if (!normalized) return [];
  return normalized.split(/\n{2,}/g).map((p) => p.trim()).filter(Boolean);
}

export function chunkSource(source: ChunkSource, options: ChunkOptions): Chunk[] {
  const paragraphs = breakIntoParagraphs(source.text);
  if (paragraphs.length === 0) {
    const id = createChunkId(source.path, source.page, 0, source.text.length);
    return [
      {
        id,
        path: source.path,
        type: source.type,
        page: source.page,
        offsetStart: 0,
        offsetEnd: source.text.length,
        text: normalize(source.text),
        tags: source.tags,
        partial: source.partial,
        mtime: source.mtime,
        tokens: Math.round(source.text.length / 5),
      },
    ];
  }

  const chunks: Chunk[] = [];
  const { chunkSize, chunkOverlap } = options;
  let cursor = 0;

  for (const paragraph of paragraphs) {
    const paraWithBreak = paragraph.endsWith("\n") ? paragraph : `${paragraph}\n\n`;
    let start = 0;
    while (start < paraWithBreak.length) {
      const available = paraWithBreak.length - start;
      const take = Math.min(chunkSize, available);
      const piece = paraWithBreak.slice(start, start + take);
      const globalStart = cursor + start;
      const globalEnd = globalStart + piece.length;
      const id = createChunkId(source.path, source.page, globalStart, globalEnd);
      chunks.push({
        id,
        path: source.path,
        type: source.type,
        page: source.page,
        offsetStart: globalStart,
        offsetEnd: globalEnd,
        text: piece,
        tags: source.tags,
        partial: source.partial,
        mtime: source.mtime,
        tokens: Math.round(piece.length / 5),
      });
      if (available <= chunkSize) break;
      start += chunkSize - chunkOverlap;
    }
    cursor += paraWithBreak.length;
  }

  return chunks;
}

export function computeChunkHash(chunk: Chunk): string {
  return hashChunkInput(chunk.path, chunk.mtime, `${chunk.page ?? ""}|${chunk.offsetStart ?? 0}|${chunk.offsetEnd ?? 0}|${chunk.text}`);
}
