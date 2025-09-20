import { promises as fs } from "fs";
import path from "path";
import { AppConfig, Chunk } from "../types.js";
import { logger } from "../utils/logger.js";
import { sha1 } from "../utils/hash.js";

export interface EmbeddingResult {
  id: string;
  vector: Float32Array;
}

interface CacheEntry {
  model: string;
  vector: number[];
}

const FALLBACK_DIM = 384;

function pseudoVector(key: string): Float32Array {
  const buffer = new Float32Array(FALLBACK_DIM);
  let seed = 0;
  for (let i = 0; i < key.length; i += 1) {
    seed = (seed * 31 + key.charCodeAt(i)) >>> 0;
  }
  for (let i = 0; i < buffer.length; i += 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    buffer[i] = (seed % 1000) / 1000;
  }
  return buffer;
}

export class Embedder {
  private cache = new Map<string, CacheEntry>();
  private cacheLoaded = false;
  private extractorPromise: Promise<any> | null = null;

  constructor(private config: AppConfig) {}

  private get cachePath(): string {
    return path.join(this.config.out.dataDir, "embeddings-cache.json");
  }

  private async loadCache(): Promise<void> {
    if (this.cacheLoaded) return;
    try {
      const raw = await fs.readFile(this.cachePath, "utf8");
      const data: Record<string, CacheEntry> = JSON.parse(raw);
      for (const [key, entry] of Object.entries(data)) {
        this.cache.set(key, entry);
      }
    } catch (err: any) {
      if (err.code !== "ENOENT") {
        logger.warn("embed-cache-load-failed", { error: err.message });
      }
    }
    this.cacheLoaded = true;
  }

  private async persistCache(): Promise<void> {
    if (!this.cacheLoaded) return;
    const data: Record<string, CacheEntry> = {};
    for (const [key, entry] of this.cache.entries()) {
      data[key] = entry;
    }
    await fs.writeFile(this.cachePath, JSON.stringify(data));
  }

  private async ensureExtractor(): Promise<any> {
    if (process.env.MCP_NN_EMBED_FAKE === "1") {
      return null;
    }
    if (!this.extractorPromise) {
      this.extractorPromise = (async () => {
        logger.info("model", { status: "loading", model: this.config.index.model });
        const transformers = await import("@xenova/transformers");
        const pipe = await transformers.pipeline("feature-extraction", this.config.index.model, {
          cache_dir: this.config.out.modelCacheDir,
        });
        logger.info("model", { status: "ready", model: this.config.index.model });
        return pipe;
      })();
    }
    return this.extractorPromise;
  }

  private vectorFromCache(hash: string): Float32Array | null {
    const entry = this.cache.get(hash);
    if (!entry || entry.model !== this.config.index.model) {
      return null;
    }
    return Float32Array.from(entry.vector);
  }

  private async vectorFromModel(text: string): Promise<Float32Array> {
    if (process.env.MCP_NN_EMBED_FAKE === "1") {
      return pseudoVector(text);
    }
    try {
      const extractor = await this.ensureExtractor();
      if (!extractor) {
        return pseudoVector(text);
      }
      const output = await extractor(text, { pooling: "mean", normalize: true });
      const data = Array.isArray(output?.data) ? output.data : output.tensor?.data ?? output;
      if (data instanceof Float32Array) {
        return data;
      }
      if (Array.isArray(data)) {
        return Float32Array.from(data);
      }
      return pseudoVector(text);
    } catch (err: any) {
      logger.warn("embed-model-fallback", { error: err.message });
      return pseudoVector(text);
    }
  }

  private async embed(text: string, cacheKey: string): Promise<Float32Array> {
    await this.loadCache();
    const hash = sha1(`${cacheKey}:${this.config.index.model}`);
    const cached = this.vectorFromCache(hash);
    if (cached) {
      return cached;
    }
    const vector = await this.vectorFromModel(text);
    this.cache.set(hash, { model: this.config.index.model, vector: Array.from(vector) });
    await this.persistCache();
    return vector;
  }

  async embedChunk(chunk: Chunk): Promise<EmbeddingResult> {
    const vector = await this.embed(chunk.text, `${chunk.id}:${chunk.mtime}`);
    return { id: chunk.id, vector };
  }

  async embedQuery(query: string): Promise<Float32Array> {
    return this.embed(query, `query:${query}`);
  }
}

let embedder: Embedder | null = null;

export function getEmbedder(config: AppConfig): Embedder {
  if (!embedder) {
    embedder = new Embedder(config);
  }
  return embedder;
}
