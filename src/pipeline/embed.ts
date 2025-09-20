import { promises as fs } from "node:fs";
import path from "node:path";
import { pipeline } from "@xenova/transformers";
import type { FeatureExtractionPipeline } from "@xenova/transformers";
import { logger } from "../utils/logger.js";

interface EmbedOptions {
  model: string;
  cacheDir?: string;
}

class EmbeddingCache {
  constructor(private dir: string) {}

  async ensureDir() {
    await fs.mkdir(this.dir, { recursive: true });
  }

  async get(id: string): Promise<Float32Array | undefined> {
    try {
      const buf = await fs.readFile(path.join(this.dir, `${id}.bin`));
      const parsed = JSON.parse(buf.toString()) as number[];
      return Float32Array.from(parsed);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return undefined;
      throw err;
    }
  }

  async set(id: string, vector: Float32Array): Promise<void> {
    await this.ensureDir();
    const data = Array.from(vector, (v) => Number(v));
    await fs.writeFile(path.join(this.dir, `${id}.bin`), JSON.stringify(data));
  }
}

let extractorPromise: Promise<FeatureExtractionPipeline> | undefined;

async function getExtractor(options: EmbedOptions): Promise<FeatureExtractionPipeline> {
  if (!extractorPromise) {
    logger.info("model-loading", { model: options.model });
    extractorPromise = pipeline("feature-extraction", options.model, {
      cache_dir: options.cacheDir,
    }) as Promise<FeatureExtractionPipeline>;
    extractorPromise.then(() => logger.info("model-ready", { model: options.model }));
  }
  return extractorPromise;
}

export async function embedText(
  text: string,
  id: string,
  options: EmbedOptions,
  cache: EmbeddingCache
): Promise<Float32Array> {
  if (process.env.MCP_NN_EMBED_STUB === "1") {
    const stub = new Float32Array(384);
    for (let i = 0; i < text.length; i += 1) {
      stub[i % stub.length] += (text.charCodeAt(i) % 31) / 100;
    }
    await cache.set(id, stub);
    return stub;
  }
  const cached = await cache.get(id);
  if (cached) return cached;
  const extractor = await getExtractor(options);
  const output = await extractor(text, { pooling: "mean", normalize: true });
  const vector = Float32Array.from(output.data as Iterable<number>);
  await cache.set(id, vector);
  return vector;
}

export function createEmbeddingCache(baseDir: string): EmbeddingCache {
  return new EmbeddingCache(baseDir);
}
