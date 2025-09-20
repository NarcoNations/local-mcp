import { v5 as uuidv5 } from "uuid";
import { Chunk, ChunkType } from "../types.js";

const UUID_NAMESPACE = uuidv5("mcp-nn-chunk", uuidv5.URL);

export interface ChunkOptions {
  path: string;
  type: ChunkType;
  page?: number;
  tags?: string[];
  size: number;
  overlap: number;
  mtime: number;
  partial?: boolean;
}

export function normalizeText(text: string): string {
  return text
    .normalize("NFKC")
    .replace(/\r\n/g, "\n")
    .replace(/[\t\v\f]+/g, " ")
    .replace(/\u0000/g, "")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getSentences(text: string): { value: string; start: number; end: number }[] {
  if (typeof (Intl as any).Segmenter === "function") {
    const segmenter = new (Intl as any).Segmenter("en", { granularity: "sentence" });
    const segments: { value: string; start: number; end: number }[] = [];
    let offset = 0;
    for (const segment of segmenter.segment(text)) {
      const value = String(segment.segment);
      const start = offset;
      const end = offset + value.length;
      segments.push({ value, start, end });
      offset = end;
    }
    return segments;
  }
  const regex = /[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g;
  const segments: { value: string; start: number; end: number }[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text))) {
    segments.push({ value: match[0], start: match.index, end: match.index + match[0].length });
  }
  if (segments.length === 0) {
    segments.push({ value: text, start: 0, end: text.length });
  }
  return segments;
}

export function chunkText(text: string, options: ChunkOptions): Chunk[] {
  const normalized = normalizeText(text);
  if (!normalized) return [];

  const segments = getSentences(normalized);
  const chunks: Chunk[] = [];
  let buffer = "";
  let bufferStart = 0;

  const flush = (force = false) => {
    if (!buffer) return;
    if (!force && buffer.length < options.size && segments.length > 0) return;
    const offsetStart = bufferStart;
    const offsetEnd = offsetStart + buffer.length;
    const idSource = `${options.path}|${options.page ?? ""}|${offsetStart}|${offsetEnd}`;
    const id = uuidv5(idSource, UUID_NAMESPACE);
    chunks.push({
      id,
      path: options.path,
      type: options.type,
      page: options.page,
      offsetStart,
      offsetEnd,
      text: buffer,
      tags: options.tags,
      partial: options.partial,
      mtime: options.mtime,
    });
    buffer = "";
  };

  for (const segment of segments) {
    const candidate = buffer ? `${buffer}\n${segment.value.trim()}` : segment.value.trim();
    if (candidate.length > options.size && buffer.length > 0) {
      flush(true);
      buffer = segment.value.trim();
      bufferStart = segment.start;
      continue;
    }
    if (!buffer) {
      bufferStart = segment.start;
      buffer = segment.value.trim();
    } else if (candidate.length <= options.size) {
      buffer = candidate;
    } else {
      flush(true);
      buffer = segment.value.trim();
      bufferStart = segment.start;
    }
  }

  if (buffer) {
    flush(true);
  }

  if (options.overlap > 0 && chunks.length > 1) {
    for (let i = 1; i < chunks.length; i++) {
      const prev = chunks[i - 1];
      const curr = chunks[i];
      if (curr.offsetStart !== undefined && curr.offsetStart - (prev.offsetEnd ?? 0) > options.overlap) {
        const start = Math.max(curr.offsetStart - options.overlap, 0);
        const textSlice = normalized.slice(start, curr.offsetStart);
        curr.text = `${textSlice}\n${curr.text}`.trim();
        curr.offsetStart = start;
      }
    }
  }

  return chunks;
}
