import { Chunk, Citation } from "../types.js";

const DEFAULT_SNIPPET = 220;

function normalizeWhitespace(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

export function buildSnippet(text: string, start?: number, end?: number, span = DEFAULT_SNIPPET): string {
  const clean = normalizeWhitespace(text);
  if (!clean) return "";
  if (start == null || end == null) {
    return clean.length > span ? `${clean.slice(0, span)}…` : clean;
  }
  const clampedStart = Math.max(0, start - Math.floor(span / 2));
  const clampedEnd = Math.min(clean.length, end + Math.floor(span / 2));
  const prefix = clampedStart > 0 ? "…" : "";
  const suffix = clampedEnd < clean.length ? "…" : "";
  return `${prefix}${clean.slice(clampedStart, clampedEnd)}${suffix}`;
}

export function buildCitation(chunk: Chunk): Citation {
  return {
    filePath: chunk.path,
    page: chunk.page,
    startChar: chunk.offsetStart,
    endChar: chunk.offsetEnd,
    snippet: buildSnippet(chunk.text, chunk.offsetStart, chunk.offsetEnd),
  };
}
