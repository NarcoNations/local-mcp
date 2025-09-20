import FlexSearch from "flexsearch";
import { Chunk } from "../types.js";

interface KeywordHit {
  id: string;
  score: number;
}

export class KeywordStore {
  private index: any;

  constructor() {
    const Document: any = (FlexSearch as any).Document ?? (FlexSearch as any).document;
    this.index = new Document({
      document: {
        id: "id",
        index: ["text", "tags"],
      },
      tokenize: "forward",
      cache: 1000,
    });
  }

  upsert(chunks: Chunk[]): void {
    for (const chunk of chunks) {
      this.index.remove(chunk.id);
      this.index.add({ id: chunk.id, text: chunk.text, tags: (chunk.tags ?? []).join(" ") });
    }
  }

  remove(ids: string[]): void {
    for (const id of ids) {
      this.index.remove(id);
    }
  }

  search(query: string, limit: number): KeywordHit[] {
    const hits: KeywordHit[] = [];
    const seen = new Map<string, number>();
    const results = this.index.search(query, { enrich: true, limit });
    for (const section of results) {
      for (const entry of section.result ?? []) {
        const prev = seen.get(entry.id) ?? 0;
        const score = Math.max(prev, entry.score ?? 0);
        seen.set(entry.id, score);
      }
    }
    for (const [id, score] of seen.entries()) {
      hits.push({ id, score });
    }
    return hits.sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, limit);
  }
}
