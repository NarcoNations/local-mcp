import { Document, type DocumentValue, type EnrichedDocumentSearchResults } from "flexsearch";
import { ChunkKind } from "../types.js";

type KeywordDocument = {
  id: string;
  text: string;
  tags: string[];
  type: ChunkKind;
  [key: string]: DocumentValue | DocumentValue[];
};

interface KeywordScore {
  id: string;
  rank: number;
}

export class KeywordStore {
  private index: Document<KeywordDocument>;

  constructor() {
    this.index = new Document<KeywordDocument>({
      document: {
        id: "id",
        store: true,
        index: ["text", "tags"],
      },
    });
  }

  upsert(doc: KeywordDocument) {
    this.index.remove(doc.id);
    this.index.add(doc.id, doc);
  }

  remove(id: string) {
    this.index.remove(id);
  }

  search(query: string, limit: number, types?: ChunkKind[]): KeywordScore[] {
    const results = this.index.search(query, {
      limit,
      enrich: true,
    }) as EnrichedDocumentSearchResults<KeywordDocument>;
    const seen = new Set<string>();
    const scores: KeywordScore[] = [];
    let rank = 0;
    for (const field of results) {
      for (const result of field.result) {
        const doc = result.doc;
        if (!doc) continue;
        if (types && !types.includes(doc.type)) continue;
        if (seen.has(doc.id)) continue;
        seen.add(doc.id);
        scores.push({ id: doc.id, rank });
        rank += 1;
      }
    }
    return scores.slice(0, limit);
  }
}
