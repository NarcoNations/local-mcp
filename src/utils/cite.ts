const MIN = 160;
const MAX = 300;

function clampSnippet(text: string): string {
  if (text.length <= MAX) return text;
  return text.slice(0, MAX - 1).trimEnd() + "…";
}

function ensureMin(text: string): string {
  if (text.length >= MIN) return text;
  return text.padEnd(MIN, " ");
}

function escapeControl(text: string): string {
  return text.replace(/[\u0000-\u001f\u007f]/g, " ");
}

export function buildSnippet(text: string, start?: number, end?: number): string {
  const sanitized = escapeControl(text).replace(/\s+/g, " ").trim();
  if (!sanitized) return "";
  const len = sanitized.length;
  if (start === undefined || end === undefined) {
    return ensureMin(clampSnippet(sanitized));
  }
  const desired = Math.max(MIN, Math.min(MAX, end - start + 80));
  const half = Math.floor(desired / 2);
  const center = Math.floor((start + end) / 2);
  let left = Math.max(0, center - half);
  let right = Math.min(len, left + desired);
  if (right - left < desired && left > 0) {
    left = Math.max(0, right - desired);
  }
  let snippet = sanitized.slice(left, right).trim();
  if (left > 0) snippet = "…" + snippet;
  if (right < len) snippet = snippet + "…";
  return ensureMin(clampSnippet(snippet));
}
