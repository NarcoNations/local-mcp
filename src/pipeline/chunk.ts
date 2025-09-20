export interface ChunkOptions {
  chunkSize: number;
  chunkOverlap: number;
}

export interface ChunkFragment {
  text: string;
  start: number;
  end: number;
}

export function normalizeText(text: string): string {
  const normalized = text.normalize("NFKC");
  const replaced = normalized.replace(/\r\n?/g, "\n");
  const collapsedSpaces = replaced.replace(/[\t\f\v ]+/g, " ");
  return collapsedSpaces.replace(/\n{3,}/g, "\n\n").trim();
}

function findBoundary(text: string, from: number, to: number): number {
  const window = text.slice(from, to);
  const newlineIndex = window.lastIndexOf("\n\n");
  if (newlineIndex !== -1) {
    return from + newlineIndex + 2;
  }
  const sentenceMatch = window.match(/[\.?!。！？](?:\s|$)/g);
  if (sentenceMatch && sentenceMatch.length) {
    const last = window.lastIndexOf(sentenceMatch[sentenceMatch.length - 1]);
    if (last !== -1) {
      return from + last + sentenceMatch[sentenceMatch.length - 1].length;
    }
  }
  const lastSpace = window.lastIndexOf(" ");
  if (lastSpace !== -1) {
    return from + lastSpace + 1;
  }
  return to;
}

export function chunkText(text: string, options: ChunkOptions): ChunkFragment[] {
  const normalized = normalizeText(text);
  const fragments: ChunkFragment[] = [];
  const { chunkSize, chunkOverlap } = options;
  if (!normalized.length) {
    return fragments;
  }

  let start = 0;
  while (start < normalized.length) {
    let end = Math.min(start + chunkSize, normalized.length);
    if (end < normalized.length) {
      const boundary = findBoundary(normalized, start, end);
      if (boundary > start + 50) {
        end = boundary;
      }
    }
    const leadingWhitespace = normalized.slice(start, end).match(/^\s*/)?.[0]?.length ?? 0;
    const trailingWhitespace = normalized.slice(start, end).match(/\s*$/)?.[0]?.length ?? 0;
    const actualStart = start + leadingWhitespace;
    const actualEnd = end - trailingWhitespace;
    if (actualEnd <= actualStart) {
      break;
    }
    fragments.push({ text: normalized.slice(actualStart, actualEnd), start: actualStart, end: actualEnd });
    if (end >= normalized.length) {
      break;
    }
    start = Math.max(actualEnd - chunkOverlap, actualEnd);
  }

  return fragments;
}
