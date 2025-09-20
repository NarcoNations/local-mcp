import { uuidV5FromComponents } from "../utils/hash.js";
import type { Chunk, ChunkKind } from "../types.js";

interface ChunkArgs {
  path: string;
  type: ChunkKind;
  text: string;
  mtime: number;
  page?: number;
  tags?: string[];
  partial?: boolean;
  chunkSize: number;
  chunkOverlap: number;
}

const CHUNK_NAMESPACE = "mcp-nn-chunk";
const sentenceSegmenter = typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter("en", { granularity: "sentence" }) : null;

function normalise(text: string): string {
  return text.normalize("NFKC").replace(/\r\n?/g, "\n").replace(/\u0000/g, "");
}

function splitParagraphs(text: string): { content: string; start: number; end: number }[] {
  const parts: { content: string; start: number; end: number }[] = [];
  let cursor = 0;
  for (const block of text.split(/\n{2,}/)) {
    const trimmed = block.trim();
    if (!trimmed) {
      cursor += block.length + 2; // approximate skip
      continue;
    }
    const start = text.indexOf(block, cursor);
    const end = start + block.length;
    parts.push({ content: trimmed, start, end });
    cursor = end;
  }
  if (parts.length === 0 && text.trim()) {
    parts.push({ content: text.trim(), start: 0, end: text.length });
  }
  return parts;
}

function splitSentences(paragraph: string): string[] {
  if (!paragraph) return [];
  if (sentenceSegmenter) {
    return Array.from(sentenceSegmenter.segment(paragraph)).map((seg) => seg.segment.trim()).filter(Boolean);
  }
  return paragraph.split(/(?<=[.!?])\s+/).filter(Boolean);
}

export function chunkDocument(args: ChunkArgs): Chunk[] {
  const { path, type, text, mtime, page, tags, partial, chunkSize, chunkOverlap } = args;
  const normalized = normalise(text);
  const paragraphs = splitParagraphs(normalized);
  const chunks: Chunk[] = [];

  let buffer = "";
  let bufferStart = 0;
  let bufferEnd = 0;

  const flush = () => {
    if (!buffer.trim()) return;
    const offsetStart = bufferStart;
    const offsetEnd = bufferEnd;
    const id = uuidV5FromComponents(CHUNK_NAMESPACE, [path, String(page ?? ""), String(offsetStart), String(offsetEnd)]);
    chunks.push({
      id,
      path,
      type,
      page,
      offsetStart,
      offsetEnd,
      text: buffer.trim(),
      mtime,
      tags,
      partial,
    });
    buffer = "";
  };

  for (const para of paragraphs) {
    const sentences = splitSentences(para.content);
    if (sentences.length === 0) continue;
    for (const sentence of sentences) {
      const addition = sentence + " ";
      if (!buffer) {
        bufferStart = para.start;
      }
      if (buffer.length + addition.length > chunkSize && buffer.length > 0) {
        flush();
        bufferStart = bufferEnd;
      }
      buffer += addition;
      bufferEnd = bufferStart + buffer.length;
    }
    if (buffer.length >= chunkSize - chunkOverlap) {
      flush();
      bufferStart = bufferEnd;
    }
  }

  if (buffer.trim()) {
    flush();
  }

  return chunks;
}
