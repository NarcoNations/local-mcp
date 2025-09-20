import { promises as fs } from "fs";
import path from "path";
import { logger } from "../utils/logger.js";

interface VectorMeta {
  offset: number;
  length: number;
  norm: number;
}

interface SearchHit {
  id: string;
  score: number;
}

export class FlatVectorIndex {
  private manifestPath: string;
  private binPath: string;
  private manifest: Record<string, VectorMeta> = {};
  private vectors = new Map<string, Float32Array>();

  constructor(private dataDir: string) {
    this.manifestPath = path.join(dataDir, "vectors.json");
    this.binPath = path.join(dataDir, "vectors.bin");
  }

  async load(): Promise<void> {
    await fs.mkdir(this.dataDir, { recursive: true });
    try {
      const rawManifest = await fs.readFile(this.manifestPath, "utf8");
      this.manifest = JSON.parse(rawManifest) as Record<string, VectorMeta>;
      const bin = await fs.readFile(this.binPath);
      for (const [id, meta] of Object.entries(this.manifest)) {
        const start = meta.offset * Float32Array.BYTES_PER_ELEMENT;
        const end = start + meta.length * Float32Array.BYTES_PER_ELEMENT;
        const slice = bin.subarray(start, end);
        this.vectors.set(id, new Float32Array(slice.buffer, slice.byteOffset, meta.length));
      }
    } catch (err: any) {
      if (err?.code !== "ENOENT") {
        logger.error("vector-load-failed", { err: String(err) });
      }
      this.manifest = {};
      this.vectors.clear();
    }
  }

  private async persist(): Promise<void> {
    const entries = Array.from(this.vectors.entries());
    const manifest: Record<string, VectorMeta> = {};
    let offset = 0;
    const buffers: Buffer[] = [];
    for (const [id, vector] of entries) {
      const buffer = Buffer.from(vector.buffer, vector.byteOffset, vector.byteLength);
      buffers.push(buffer);
      const length = vector.length;
      const norm = Math.sqrt(vector.reduce((acc, val) => acc + val * val, 0));
      manifest[id] = { offset, length, norm };
      offset += length;
    }
    const combined = Buffer.concat(buffers);
    await fs.writeFile(this.binPath, combined);
    await fs.writeFile(this.manifestPath, JSON.stringify(manifest, null, 2), "utf8");
    this.manifest = manifest;
  }

  async rebuild(vectors: Map<string, Float32Array>): Promise<void> {
    this.vectors = new Map(vectors);
    await this.persist();
  }

  get size(): number {
    return this.vectors.size;
  }

  entries(): IterableIterator<[string, Float32Array]> {
    return this.vectors.entries();
  }

  get(id: string): Float32Array | undefined {
    return this.vectors.get(id);
  }

  search(query: Float32Array, topK: number): SearchHit[] {
    const hits: SearchHit[] = [];
    for (const [id, vector] of this.vectors.entries()) {
      let score = 0;
      for (let i = 0; i < Math.min(vector.length, query.length); i++) {
        score += vector[i] * query[i];
      }
      hits.push({ id, score });
    }
    hits.sort((a, b) => b.score - a.score);
    return hits.slice(0, topK);
  }
}
