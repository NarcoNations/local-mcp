import { Citation } from "../types.js";
import { normaliseSnippet } from "./fs-guard.js";

export function createSnippet(text: string, start?: number, end?: number, desired = 240): string {
  const clean = normaliseSnippet(text);
  if (!clean) return "";
  if (start === undefined || end === undefined) {
    if (clean.length <= desired) return clean;
    return `${clean.slice(0, desired)}…`;
  }
  const radius = Math.floor(desired / 2);
  const center = Math.floor((start + end) / 2);
  const begin = Math.max(0, center - radius);
  const finish = Math.min(clean.length, center + radius);
  const prefix = begin > 0 ? "…" : "";
  const suffix = finish < clean.length ? "…" : "";
  return `${prefix}${clean.slice(begin, finish)}${suffix}`;
}

export function buildCitation(filePath: string, page: number | undefined, chunkText: string, offsetStart?: number, offsetEnd?: number): Citation {
  return {
    filePath,
    page,
    startChar: offsetStart,
    endChar: offsetEnd,
    snippet: createSnippet(chunkText, offsetStart, offsetEnd),
  };
}
