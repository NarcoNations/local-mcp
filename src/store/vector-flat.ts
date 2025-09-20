import { promises as fs } from "fs";
import path from "path";
import { logger } from "../utils/logger.js";

export interface VectorScore {
  id: string;
  score: number;
}

interface StoredVector {
  vector: Float32Array;
  norm: number;
}

export class FlatVectorStore {
  private vectors = new Map<string, StoredVector>();
  private dirty = false;

  constructor(private baseDir: string) {}

  static async load(baseDir: string): Promise<FlatVectorStore> {
    const store = new FlatVectorStore(baseDir);
    await store.load();
    return store;
  }

  private async load() {
    await fs.mkdir(this.baseDir, { recursive: true });
    const manifestPath = path.join(this.baseDir, "vectors.json");
    const binPath = path.join(this.baseDir, "vectors.bin");
    try {
      const manifestRaw = await fs.readFile(manifestPath, "utf8");
      const manifest = JSON.parse(manifestRaw) as Record<string, { offset: number; length: number; norm: number }>;
      const bin = await fs.readFile(binPath);
      const buffer = new Float32Array(bin.buffer, bin.byteOffset, bin.byteLength / Float32Array.BYTES_PER_ELEMENT);
      for (const [id, entry] of Object.entries(manifest)) {
        const { offset, length, norm } = entry;
        const slice = buffer.subarray(offset, offset + length);
        this.vectors.set(id, { vector: Float32Array.from(slice), norm });
      }
      logger.info("vector-flat-loaded", { count: this.vectors.size });
    } catch (err) {
      logger.info("vector-flat-new", { baseDir: this.baseDir, err: (err as Error).message });
    }
  }

  private computeNorm(vector: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < vector.length; i += 1) {
      sum += vector[i] * vector[i];
    }
    return Math.sqrt(sum);
  }

  upsert(id: string, vector: Float32Array) {
    const norm = this.computeNorm(vector);
    this.vectors.set(id, { vector, norm });
    this.dirty = true;
  }

  delete(id: string) {
    if (this.vectors.delete(id)) {
      this.dirty = true;
    }
  }

  async persist() {
    if (!this.dirty) return;
    const manifestPath = path.join(this.baseDir, "vectors.json");
    const binPath = path.join(this.baseDir, "vectors.bin");
    const entries = Array.from(this.vectors.entries());
    const manifest: Record<string, { offset: number; length: number; norm: number }> = {};
    let offset = 0;
    const buffers: Buffer[] = [];
    for (const [id, stored] of entries) {
      manifest[id] = { offset, length: stored.vector.length, norm: stored.norm };
      const buf = Buffer.from(stored.vector.buffer, stored.vector.byteOffset, stored.vector.byteLength);
      buffers.push(Buffer.from(buf));
      offset += stored.vector.length;
    }
    await fs.writeFile(binPath, Buffer.concat(buffers));
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
    this.dirty = false;
  }

  search(query: Float32Array, k: number): VectorScore[] {
    const norm = this.computeNorm(query);
    if (!norm) return [];
    const scores: VectorScore[] = [];
    for (const [id, stored] of this.vectors.entries()) {
      if (!stored.norm) continue;
      let dot = 0;
      const vec = stored.vector;
      for (let i = 0; i < vec.length; i += 1) {
        dot += vec[i] * query[i];
      }
      const score = dot / (norm * stored.norm);
      scores.push({ id, score });
    }
    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }

  size() {
    return this.vectors.size;
  }
}
