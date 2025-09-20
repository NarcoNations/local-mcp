const SNIPPET_MIN = 160;
const SNIPPET_MAX = 320;

export function buildSnippet(text: string, start = 0, end = Math.min(text.length, SNIPPET_MAX)): string {
  const safeStart = Math.max(0, start - Math.floor(SNIPPET_MIN / 2));
  const safeEnd = Math.min(text.length, end + Math.floor(SNIPPET_MIN / 2));
  let snippet = text.slice(safeStart, safeEnd).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
  snippet = snippet.replace(/\s+/g, " ").trim();
  if (safeStart > 0) snippet = `…${snippet}`;
  if (safeEnd < text.length) snippet = `${snippet}…`;
  return snippet;
}
