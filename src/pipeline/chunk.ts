import { chunkId, normalizeText } from "../utils/hash.js";
import { Chunk, ChunkType } from "../types.js";

export interface ChunkOptions {
  path: string;
  type: ChunkType;
  page?: number;
  chunkSize: number;
  chunkOverlap: number;
  tags?: string[];
  partial?: boolean;
  mtime: number;
}

interface ChunkSlice {
  text: string;
  start: number;
  end: number;
}

function findBoundary(text: string, candidateStart: number, candidateEnd: number): number {
  if (candidateEnd >= text.length) return text.length;
  const window = text.slice(candidateStart, candidateEnd);
  const newline = window.lastIndexOf("\n\n");
  if (newline > 80) {
    return candidateStart + newline + 2;
  }
  const sentence = window.lastIndexOf(". ");
  if (sentence > 120) {
    return candidateStart + sentence + 1;
  }
  const space = window.lastIndexOf(" ");
  if (space > 0) {
    return candidateStart + space;
  }
  return candidateEnd;
}

function chunkText(text: string, chunkSize: number, chunkOverlap: number): ChunkSlice[] {
  const normalized = normalizeText(text).replace(/\r/g, "");
  const length = normalized.length;
  const slices: ChunkSlice[] = [];
  if (!length) return slices;
  let start = 0;
  while (start < length) {
    let end = Math.min(length, start + chunkSize);
    end = findBoundary(normalized, start, end);
    if (end <= start) {
      end = Math.min(length, start + chunkSize);
    }
    const rawSlice = normalized.slice(start, end);
    const trimmed = rawSlice.trim();
    if (!trimmed) {
      start = end;
      continue;
    }
    const leading = rawSlice.indexOf(trimmed);
    const sliceStart = start + (leading >= 0 ? leading : 0);
    const sliceEnd = sliceStart + trimmed.length;
    slices.push({ text: trimmed, start: sliceStart, end: sliceEnd });
    if (end >= length) break;
    start = Math.max(sliceEnd - chunkOverlap, 0);
    while (start < length && /\s/.test(normalized[start])) {
      start += 1;
    }
    if (start >= length) break;
  }
  return slices;
}

export function buildChunks(text: string, options: ChunkOptions): Chunk[] {
  const slices = chunkText(text, options.chunkSize, options.chunkOverlap);
  return slices.map((slice) => {
    const id = chunkId(options.path, options.page, slice.start, slice.end);
    const tokens = Math.ceil(slice.text.length / 4.5);
    return {
      id,
      path: options.path,
      type: options.type,
      page: options.page,
      offsetStart: slice.start,
      offsetEnd: slice.end,
      text: slice.text,
      tokens,
      tags: options.tags,
      partial: options.partial,
      mtime: options.mtime
    } satisfies Chunk;
  });
}
