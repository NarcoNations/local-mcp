import { promises as fs } from "node:fs";
import path from "node:path";
import FlexSearch from "flexsearch";

export interface KeywordHit {
  id: string;
  score: number;
}

interface KeywordRecord {
  id: string;
  text: string;
  tags?: string[];
}

export class KeywordIndex {
  private index = new FlexSearch.Index({ tokenize: "forward", preset: "match", context: true });
  private docs = new Map<string, KeywordRecord>();

  constructor(private filePath: string) {}

  async load(): Promise<void> {
    try {
      const raw = await fs.readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as KeywordRecord[];
      for (const record of parsed) {
        this.docs.set(record.id, record);
        this.index.add(record.id, record.text);
      }
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    }
  }

  async persist(): Promise<void> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(Array.from(this.docs.values())));
  }

  upsert(record: KeywordRecord): void {
    this.docs.set(record.id, record);
     this.index.remove(record.id);
    this.index.add(record.id, record.text);
  }

  remove(id: string): void {
    this.docs.delete(id);
    this.index.remove(id);
  }

  search(query: string, k: number, tags?: string[]): KeywordHit[] {
    const ids = this.index.search(query, k) as string[];
    const hits: KeywordHit[] = [];
    for (const id of ids) {
      const doc = this.docs.get(id);
      if (!doc) continue;
      if (tags && tags.length) {
        const docTags = doc.tags || [];
        if (!tags.every((tag) => docTags.includes(tag))) continue;
      }
      hits.push({ id, score: 1 });
    }
    return hits;
  }
}
