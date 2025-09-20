import { promises as fs } from "fs";
import path from "path";
import { logger } from "../utils/logger.js";

export interface VectorRecord {
  id: string;
  vector: Float32Array;
}

interface ManifestEntry {
  offset: number;
  length: number;
  norm: number;
}

interface VectorManifest {
  version: number;
  dimension: number;
  entries: Record<string, ManifestEntry>;
}

export class FlatVectorStore {
  private vectors = new Map<string, Float32Array>();
  private manifest: VectorManifest = { version: 1, dimension: 0, entries: {} };

  private constructor(private readonly filePath: string, private readonly manifestPath: string) {}

  static async create(dataDir: string): Promise<FlatVectorStore> {
    const filePath = path.join(dataDir, "vectors.bin");
    const manifestPath = path.join(dataDir, "vectors.json");
    const store = new FlatVectorStore(filePath, manifestPath);
    await store.load();
    return store;
  }

  private async load(): Promise<void> {
    try {
      const raw = await fs.readFile(this.manifestPath, "utf8");
      this.manifest = JSON.parse(raw) as VectorManifest;
    } catch (err: any) {
      if (err.code !== "ENOENT") {
        logger.warn("vector-manifest-load-failed", { error: err.message });
      }
      this.manifest = { version: 1, dimension: 0, entries: {} };
      return;
    }

    try {
      const buffer = await fs.readFile(this.filePath);
      const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
      for (const [id, entry] of Object.entries(this.manifest.entries)) {
        const arr = new Float32Array(entry.length);
        for (let i = 0; i < entry.length; i += 1) {
          arr[i] = view.getFloat32((entry.offset + i) * 4, true);
        }
        this.vectors.set(id, arr);
      }
    } catch (err: any) {
      if (err.code !== "ENOENT") {
        logger.warn("vector-load-failed", { error: err.message });
      }
    }
  }

  private computeNorm(vector: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < vector.length; i += 1) {
      sum += vector[i] * vector[i];
    }
    return Math.sqrt(sum);
  }

  private async persist(): Promise<void> {
    const entries = Array.from(this.vectors.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    const totalLength = entries.reduce((acc, [, vec]) => acc + vec.length, 0);
    const buffer = Buffer.alloc(totalLength * 4);
    const manifestEntries: Record<string, ManifestEntry> = {};
    let offset = 0;
    let dimension = 0;
    for (const [id, vector] of entries) {
      for (let i = 0; i < vector.length; i += 1) {
        buffer.writeFloatLE(vector[i], (offset + i) * 4);
      }
      manifestEntries[id] = {
        offset,
        length: vector.length,
        norm: this.computeNorm(vector),
      };
      offset += vector.length;
      dimension = vector.length;
    }
    await fs.writeFile(this.filePath, buffer);
    this.manifest = {
      version: 1,
      dimension: dimension || this.manifest.dimension,
      entries: manifestEntries,
    };
    await fs.writeFile(this.manifestPath, JSON.stringify(this.manifest, null, 2));
  }

  async upsert(records: VectorRecord[]): Promise<void> {
    let dirty = false;
    for (const record of records) {
      this.vectors.set(record.id, record.vector);
      dirty = true;
    }
    if (dirty) {
      await this.persist();
    }
  }

  remove(ids: string[]): void {
    for (const id of ids) {
      this.vectors.delete(id);
      delete this.manifest.entries[id];
    }
  }

  search(vector: Float32Array, k: number): Array<{ id: string; score: number }> {
    const results: Array<{ id: string; score: number }> = [];
    const queryNorm = this.computeNorm(vector) || 1;
    for (const [id, storedVector] of this.vectors.entries()) {
      const manifestEntry = this.manifest.entries[id];
      const storedNorm = (manifestEntry?.norm ?? this.computeNorm(storedVector)) || 1;
      let dot = 0;
      const dim = Math.min(vector.length, storedVector.length);
      for (let i = 0; i < dim; i += 1) {
        dot += vector[i] * storedVector[i];
      }
      const denom = queryNorm * storedNorm || 1;
      const score = denom === 0 ? 0 : dot / denom;
      results.push({ id, score });
    }
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }

  size(): number {
    return this.vectors.size;
  }
}
