import { getEncoder, decodeTokens } from "./tokenizer.js";
import { stripShortcodes } from "../text/shortcodes.js";

export interface SectionInput {
  heading?: string;
  text: string;
  page?: number;
  order: number;
}

export interface ChunkOutput {
  ordinal: number;
  heading?: string;
  text: string;
  snippet: string;
  tokenCount: number;
  offsetStart: number;
  offsetEnd: number;
  page?: number;
}

export interface ChunkerOptions {
  chunkTokens: number;
  overlapTokens: number;
}

const DEFAULT_OPTIONS: ChunkerOptions = {
  chunkTokens: 900,
  overlapTokens: 150,
};

export function chunkSections(
  sections: SectionInput[],
  options: Partial<ChunkerOptions> = {}
): ChunkOutput[] {
  const encoder = getEncoder();
  const { chunkTokens, overlapTokens } = { ...DEFAULT_OPTIONS, ...options };
  const results: ChunkOutput[] = [];
  let ordinal = 0;

  for (const section of sections.sort((a, b) => a.order - b.order)) {
    const encoded = encoder.encode(section.text);
    if (encoded.length === 0) continue;

    let startToken = 0;
    while (startToken < encoded.length) {
      const endToken = Math.min(startToken + chunkTokens, encoded.length);
      const tokenSlice = encoded.subarray(startToken, endToken);
      const text = decodeTokens(tokenSlice);
      const snippet = stripShortcodes(text).slice(0, 600);
      const chunk: ChunkOutput = {
        ordinal: ordinal++,
        heading: section.heading,
        text,
        snippet,
        tokenCount: tokenSlice.length,
        offsetStart: tokensToCharOffset(encoded, startToken),
        offsetEnd: tokensToCharOffset(encoded, endToken),
        page: section.page,
      };
      results.push(chunk);
      if (endToken === encoded.length) break;
      startToken = Math.max(endToken - overlapTokens, startToken + 1);
    }
  }

  return results;
}

function tokensToCharOffset(tokens: Uint32Array, endIndex: number): number {
  if (endIndex <= 0) return 0;
  const slice = tokens.subarray(0, endIndex);
  return decodeTokens(slice).length;
}
