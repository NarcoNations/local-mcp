import { promises as fs } from "fs";
import path from "path";
import FlexSearch from "flexsearch";
import type { Chunk } from "../types.js";
import { ensureDir } from "../utils/fs-guard.js";

interface KeywordDoc {
  id: string;
  text: string;
  tags?: string[];
  type: string;
}

export class KeywordIndex {
  private index: any;
  private docs = new Map<string, KeywordDoc>();

  constructor(private dir: string) {
    this.index = new (FlexSearch as any).Document({
      id: "id",
      document: {
        id: "id",
        index: ["text", "tags"],
        store: ["text", "tags", "type"],
      },
      tokenize: "forward",
    });
  }

  private filePath() {
    return path.join(this.dir, "keyword-docs.json");
  }

  async load(): Promise<void> {
    await ensureDir(this.dir);
    try {
      const raw = await fs.readFile(this.filePath(), "utf8");
      const docs: KeywordDoc[] = JSON.parse(raw);
      docs.forEach(doc => this.addDoc(doc));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        throw err;
      }
    }
  }

  private addDoc(doc: KeywordDoc) {
    this.docs.set(doc.id, doc);
    this.index.add({
      id: doc.id,
      text: doc.text,
      tags: (doc.tags ?? []).join(" "),
      type: doc.type,
    });
  }

  add(chunk: Chunk) {
    const doc: KeywordDoc = {
      id: chunk.id,
      text: chunk.text,
      tags: chunk.tags,
      type: chunk.type,
    };
    this.addDoc(doc);
  }

  remove(chunkId: string) {
    this.docs.delete(chunkId);
    this.index.remove(chunkId);
  }

  search(query: string, limit: number): Array<{ chunkId: string; score: number }> {
    const enriched = this.index.search(query, { enrich: true, limit });
    const seen = new Set<string>();
    const results: Array<{ chunkId: string; score: number }> = [];
    for (const field of enriched as Array<{ field: string; result: Array<{ id: string; score: number }> }>) {
      for (const item of field.result) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          results.push({ chunkId: item.id, score: item.score ?? 0 });
          if (results.length >= limit) return results;
        }
      }
    }
    return results;
  }

  count(): number {
    return this.docs.size;
  }

  async persist(): Promise<void> {
    await ensureDir(this.dir);
    const docs = Array.from(this.docs.values());
    await fs.writeFile(this.filePath(), JSON.stringify(docs, null, 2), "utf8");
  }
}
