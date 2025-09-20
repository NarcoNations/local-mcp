import { promises as fs } from "fs";
import path from "path";
import { VECTORS_BIN, VECTORS_JSON } from "./schema.js";

interface VectorEntry {
  offset: number;
  length: number;
  norm: number;
}

interface SearchResult {
  id: string;
  score: number;
}

export class FlatVectorStore {
  private readonly dataDir: string;
  private readonly binPath: string;
  private readonly manifestPath: string;
  private vectors = new Map<string, Float32Array>();
  private norms = new Map<string, number>();

  constructor(dataDir: string) {
    this.dataDir = dataDir;
    this.binPath = path.join(dataDir, VECTORS_BIN);
    this.manifestPath = path.join(dataDir, VECTORS_JSON);
  }

  async load(): Promise<void> {
    try {
      const manifestRaw = await fs.readFile(this.manifestPath, "utf8");
      const manifest = JSON.parse(manifestRaw) as Record<string, VectorEntry>;
      const bin = await fs.readFile(this.binPath);
      const view = new Float32Array(bin.buffer, bin.byteOffset, bin.byteLength / 4);
      for (const [id, entry] of Object.entries(manifest)) {
        const slice = view.slice(entry.offset, entry.offset + entry.length);
        this.vectors.set(id, new Float32Array(slice));
        this.norms.set(id, entry.norm);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        await fs.mkdir(this.dataDir, { recursive: true });
        return;
      }
      throw error;
    }
  }

  size(): number {
    return this.vectors.size;
  }

  private async persist(): Promise<void> {
    await fs.mkdir(this.dataDir, { recursive: true });
    const manifest: Record<string, VectorEntry> = {};
    let totalFloats = 0;
    const entries = Array.from(this.vectors.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    for (const [, vector] of entries) {
      totalFloats += vector.length;
    }
    const buffer = Buffer.allocUnsafe(totalFloats * 4);
    const view = new Float32Array(totalFloats);
    let offset = 0;
    for (const [id, vector] of entries) {
      view.set(vector, offset);
      const norm = this.norms.get(id) ?? this.calculateNorm(vector);
      manifest[id] = { offset, length: vector.length, norm };
      offset += vector.length;
    }
    const uint8 = new Uint8Array(view.buffer);
    buffer.set(uint8);
    await fs.writeFile(this.binPath, buffer);
    await fs.writeFile(this.manifestPath, JSON.stringify(manifest, null, 2), "utf8");
  }

  private calculateNorm(vector: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < vector.length; i += 1) {
      sum += vector[i] * vector[i];
    }
    return Math.sqrt(Math.max(sum, 1e-12));
  }

  async upsert(entries: { id: string; vector: Float32Array }[]): Promise<void> {
    let changed = false;
    for (const entry of entries) {
      this.vectors.set(entry.id, new Float32Array(entry.vector));
      this.norms.set(entry.id, this.calculateNorm(entry.vector));
      changed = true;
    }
    if (changed) await this.persist();
  }

  async delete(ids: string[]): Promise<void> {
    let changed = false;
    for (const id of ids) {
      if (this.vectors.delete(id)) {
        this.norms.delete(id);
        changed = true;
      }
    }
    if (changed) await this.persist();
  }

  search(query: Float32Array, k: number): SearchResult[] {
    const results: SearchResult[] = [];
    const queryNorm = this.calculateNorm(query);
    if (!queryNorm) return results;
    for (const [id, vector] of this.vectors.entries()) {
      const score = this.cosine(query, queryNorm, vector, this.norms.get(id));
      results.push({ id, score });
    }
    return results
      .filter((result) => Number.isFinite(result.score))
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }

  private cosine(query: Float32Array, queryNorm: number, target: Float32Array, targetNorm = this.calculateNorm(target)): number {
    let dot = 0;
    const length = Math.min(query.length, target.length);
    for (let i = 0; i < length; i += 1) {
      dot += query[i] * target[i];
    }
    const denom = queryNorm * targetNorm;
    if (denom === 0) return 0;
    return dot / denom;
  }

  has(id: string): boolean {
    return this.vectors.has(id);
  }
}
