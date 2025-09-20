import FlexSearch from "flexsearch";
import type { Chunk } from "../types.js";

interface KeywordHit {
  id: string;
  score: number;
}

const DOCUMENT_CONFIG = {
  document: {
    id: "id",
    index: ["text", "tags"],
    store: ["text"],
  },
  tokenize: "forward" as const,
};

export class KeywordIndex {
  private index = new FlexSearch.Document(DOCUMENT_CONFIG);

  rebuild(chunks: Chunk[]): void {
    this.index = new FlexSearch.Document(DOCUMENT_CONFIG);
    chunks.forEach((chunk) => {
      this.index.add(chunk.id, {
        id: chunk.id,
        text: chunk.text,
        tags: chunk.tags ?? [],
      });
    });
  }

  search(query: string, topK: number): KeywordHit[] {
    const results = this.index.search(query, { field: ["text", "tags"], limit: topK });
    const hits: KeywordHit[] = [];
    const groups = Array.isArray(results) ? (results as any[]) : [];
    for (const group of groups) {
      const ids = Array.isArray(group.result) ? group.result : [];
      for (const id of ids) {
        hits.push({ id, score: group.score ?? 1 });
      }
    }
    hits.sort((a, b) => b.score - a.score);
    return hits.slice(0, topK);
  }
}
