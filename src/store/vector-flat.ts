import { promises as fs } from "fs";
import path from "path";
import { ensureDir } from "../utils/fs-guard.js";

interface ManifestEntry {
  offset: number;
  length: number;
}

interface VectorManifest {
  dimension: number;
  vectors: Record<string, ManifestEntry>;
}

export class FlatVectorIndex {
  private vectors = new Map<string, Float32Array>();
  private dimension: number | undefined;

  constructor(private dir: string) {}

  private manifestPath() {
    return path.join(this.dir, "vectors.json");
  }

  private dataPath() {
    return path.join(this.dir, "vectors.bin");
  }

  async load(): Promise<void> {
    await ensureDir(this.dir);
    try {
      const manifestRaw = await fs.readFile(this.manifestPath(), "utf8");
      const manifest = JSON.parse(manifestRaw) as VectorManifest;
      const data = await fs.readFile(this.dataPath());
      const floatView = new Float32Array(data.buffer, data.byteOffset, data.byteLength / 4);
      this.dimension = manifest.dimension;
      Object.entries(manifest.vectors).forEach(([chunkId, info]) => {
        const slice = floatView.slice(info.offset, info.offset + info.length);
        this.vectors.set(chunkId, Float32Array.from(slice));
      });
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        throw err;
      }
    }
  }

  setVector(chunkId: string, vector: Float32Array) {
    if (!this.dimension) {
      this.dimension = vector.length;
    }
    if (vector.length !== this.dimension) {
      throw new Error(`Vector dimension mismatch: expected ${this.dimension}, received ${vector.length}`);
    }
    this.vectors.set(chunkId, Float32Array.from(vector));
  }

  removeVectors(chunkIds: string[]) {
    chunkIds.forEach(id => this.vectors.delete(id));
  }

  search(query: Float32Array, k: number): Array<{ chunkId: string; score: number }> {
    const results: Array<{ chunkId: string; score: number }> = [];
    for (const [chunkId, vector] of this.vectors.entries()) {
      let dot = 0;
      for (let i = 0; i < vector.length; i++) {
        dot += vector[i] * query[i];
      }
      if (results.length < k) {
        results.push({ chunkId, score: dot });
        results.sort((a, b) => b.score - a.score);
      } else if (dot > results[results.length - 1].score) {
        results[results.length - 1] = { chunkId, score: dot };
        results.sort((a, b) => b.score - a.score);
      }
    }
    return results.slice(0, k);
  }

  size(): number {
    return this.vectors.size;
  }

  async persist(): Promise<void> {
    await ensureDir(this.dir);
    if (!this.dimension) {
      await fs.writeFile(this.manifestPath(), JSON.stringify({ dimension: 0, vectors: {} }, null, 2));
      await fs.writeFile(this.dataPath(), Buffer.alloc(0));
      return;
    }
    const entries = Array.from(this.vectors.entries());
    const floatsPerVector = this.dimension;
    const totalFloats = floatsPerVector * entries.length;
    const buffer = Buffer.alloc(totalFloats * 4);
    const view = new Float32Array(buffer.buffer, buffer.byteOffset, totalFloats);

    const manifest: VectorManifest = {
      dimension: this.dimension,
      vectors: {},
    };

    entries.forEach(([chunkId, vector], idx) => {
      const offset = idx * floatsPerVector;
      view.set(vector, offset);
      manifest.vectors[chunkId] = { offset, length: floatsPerVector };
    });

    await fs.writeFile(this.manifestPath(), JSON.stringify(manifest, null, 2));
    await fs.writeFile(this.dataPath(), buffer);
  }
}
