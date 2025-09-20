import { promises as fs } from "fs";
import path from "path";
import FlexSearch from "flexsearch";
import type { Document as FlexSearchDocument } from "flexsearch";
import { KEYWORD_INDEX } from "./schema.js";

type KeywordDocument = {
  id: string;
  text: string;
  tags?: string[];
} & Record<string, string | string[]>;

export class KeywordStore {
  private readonly dataDir: string;
  private readonly indexPath: string;
  private readonly index: FlexSearchDocument<KeywordDocument, true>;
  private readonly docs = new Map<string, KeywordDocument>();

  constructor(dataDir: string) {
    this.dataDir = dataDir;
    this.indexPath = path.join(dataDir, KEYWORD_INDEX);
    this.index = new FlexSearch.Document<KeywordDocument, true>({
      document: {
        id: "id",
        index: ["text", "tags"],
        store: true
      },
      tokenize: "forward",
      cache: true,
      context: true
    });
  }

  async load(): Promise<void> {
    try {
      const raw = await fs.readFile(this.indexPath, "utf8");
      const docs = JSON.parse(raw) as KeywordDocument[];
      for (const doc of docs) {
        this.docs.set(doc.id, doc);
        this.index.add(doc);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        await fs.mkdir(this.dataDir, { recursive: true });
        return;
      }
      throw error;
    }
  }

  private async persist(): Promise<void> {
    await fs.mkdir(this.dataDir, { recursive: true });
    const docs = Array.from(this.docs.values());
    await fs.writeFile(this.indexPath, JSON.stringify(docs, null, 2), "utf8");
  }

  async upsert(documents: KeywordDocument[]): Promise<void> {
    for (const doc of documents) {
      this.docs.set(doc.id, doc);
      this.index.remove(doc.id);
      this.index.add(doc);
    }
    await this.persist();
  }

  async delete(ids: string[]): Promise<void> {
    for (const id of ids) {
      this.docs.delete(id);
      this.index.remove(id);
    }
    await this.persist();
  }

  search(query: string, limit: number): { id: string; score: number }[] {
    const enriched = this.index.search(query, { limit, enrich: true }) as unknown;
    const flattened: { id: string; score: number }[] = [];
    const seen = new Set<string>();
    for (const unit of enriched as any[]) {
      for (const match of unit.result as any[]) {
        const id = match.id as string;
        if (seen.has(id)) continue;
        seen.add(id);
        const score = typeof match.score === "number" ? match.score : 1;
        flattened.push({ id, score });
      }
    }
    return flattened.slice(0, limit);
  }
}
