export interface SnippetOptions {
  maxLength?: number;
}

export function buildSnippet(text: string, start: number | undefined, end: number | undefined, options: SnippetOptions = {}): string {
  const maxLength = options.maxLength ?? 240;
  const clean = text.replace(/[\u0000-\u001f]+/g, " ");
  if (start === undefined || end === undefined || start < 0 || end > clean.length) {
    return clean.slice(0, maxLength).trim();
  }
  const center = Math.floor((start + end) / 2);
  const half = Math.floor(maxLength / 2);
  const snippetStart = Math.max(0, center - half);
  const snippetEnd = Math.min(clean.length, snippetStart + maxLength);
  let snippet = clean.slice(snippetStart, snippetEnd).trim();
  if (snippetStart > 0) {
    snippet = `…${snippet}`;
  }
  if (snippetEnd < clean.length) {
    snippet = `${snippet}…`;
  }
  return snippet;
}
