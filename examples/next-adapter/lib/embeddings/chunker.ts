export type ChunkOptions = {
  chunkSize?: number;
  overlap?: number;
};

export function chunkText(text: string, options: ChunkOptions = {}): string[] {
  const chunkSize = Math.max(1, options.chunkSize ?? 700);
  const overlap = Math.min(chunkSize - 1, Math.max(0, options.overlap ?? 150));
  const words = text.replace(/\r\n/g, '\n').split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const step = Math.max(1, chunkSize - overlap);
  const chunks: string[] = [];
  for (let start = 0; start < words.length; start += step) {
    const slice = words.slice(start, start + chunkSize);
    if (!slice.length) continue;
    chunks.push(joinWords(slice));
    if (start + chunkSize >= words.length) break;
  }
  return chunks;
}

function joinWords(words: string[]) {
  const text = words.join(' ').trim();
  return text;
}
