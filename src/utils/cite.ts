import { Citation, Chunk } from "../types.js";

const SNIPPET_MIN = 160;
const SNIPPET_MAX = 300;

function clampSnippet(text: string, start: number, end: number): string {
  const length = text.length;
  const span = end - start;
  let snippetStart = Math.max(0, start - Math.max(0, (SNIPPET_MAX - span) / 2));
  let snippetEnd = Math.min(length, end + Math.max(0, (SNIPPET_MAX - span) / 2));

  if (snippetEnd - snippetStart < SNIPPET_MIN) {
    const padding = Math.ceil((SNIPPET_MIN - (snippetEnd - snippetStart)) / 2);
    snippetStart = Math.max(0, snippetStart - padding);
    snippetEnd = Math.min(length, snippetEnd + padding);
  }

  let snippet = text.slice(snippetStart, snippetEnd).trim();
  if (snippetStart > 0) snippet = `…${snippet}`;
  if (snippetEnd < length) snippet = `${snippet}…`;
  return snippet.replace(/\s+/g, " ");
}

export function buildCitation(chunk: Chunk, start?: number, end?: number): Citation {
  const startChar = start ?? chunk.offsetStart ?? 0;
  const endChar = end ?? chunk.offsetEnd ?? Math.min(chunk.text.length, startChar + SNIPPET_MIN);
  const snippet = clampSnippet(chunk.text, startChar, endChar);

  return {
    filePath: chunk.path,
    page: chunk.page,
    startChar,
    endChar,
    snippet,
  };
}
