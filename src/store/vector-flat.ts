import { promises as fs } from "node:fs";
import path from "node:path";

interface VectorRecord {
  id: string;
  vector: number[];
}

export interface VectorHit {
  id: string;
  score: number;
}

export class FlatVectorIndex {
  private vectors = new Map<string, Float32Array>();
  private norms = new Map<string, number>();

  constructor(private filePath: string) {}

  async load(): Promise<void> {
    try {
      const raw = await fs.readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as VectorRecord[];
      for (const record of parsed) {
        const vector = Float32Array.from(record.vector);
        this.vectors.set(record.id, vector);
        this.norms.set(record.id, this.vectorNorm(vector));
      }
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    }
  }

  async persist(): Promise<void> {
    const out: VectorRecord[] = [];
    for (const [id, vector] of this.vectors) {
      out.push({ id, vector: Array.from(vector) });
    }
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(out));
  }

  upsert(id: string, vector: Float32Array): void {
    this.vectors.set(id, vector);
    this.norms.set(id, this.vectorNorm(vector));
  }

  remove(id: string): void {
    this.vectors.delete(id);
    this.norms.delete(id);
  }

  cosine(query: Float32Array, target: Float32Array, targetNorm: number): number {
    let dot = 0;
    for (let i = 0; i < query.length; i += 1) {
      dot += query[i] * target[i];
    }
    const queryNorm = this.vectorNorm(query);
    return dot / (queryNorm * targetNorm || 1);
  }

  search(query: Float32Array, k: number): VectorHit[] {
    const results: VectorHit[] = [];
    for (const [id, vector] of this.vectors) {
      const norm = this.norms.get(id);
      if (!norm) continue;
      const score = this.cosine(query, vector, norm);
      results.push({ id, score });
    }
    return results.sort((a, b) => b.score - a.score).slice(0, k);
  }

  private vectorNorm(vec: Float32Array): number {
    let sum = 0;
    for (const value of vec) sum += value * value;
    return Math.sqrt(sum);
  }
}
