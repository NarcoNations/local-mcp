import { promises as fs } from "fs";
import path from "path";
import { pipeline, type FeatureExtractionPipeline } from "@xenova/transformers";
import { logger } from "../utils/logger.js";
import { hashString } from "../utils/hash.js";

interface EmbedOptions {
  model: string;
  dataDir: string;
  modelCacheDir?: string;
}

let extractorPromise: Promise<FeatureExtractionPipeline> | null = null;

async function loadExtractor(model: string, modelCacheDir?: string): Promise<FeatureExtractionPipeline> {
  if (!extractorPromise) {
    logger.info("embedding-model-load", { model });
    if (modelCacheDir) {
      process.env.TRANSFORMERS_CACHE = modelCacheDir;
    }
    extractorPromise = pipeline("feature-extraction", model, { progress_callback: () => {} }) as Promise<FeatureExtractionPipeline>;
  }
  const extractor = await extractorPromise;
  return extractor;
}

async function readCachedVector(cacheFile: string): Promise<Float32Array | null> {
  try {
    const buf = await fs.readFile(cacheFile);
    return new Float32Array(buf.buffer, buf.byteOffset, buf.length / Float32Array.BYTES_PER_ELEMENT);
  } catch (err: any) {
    if (err?.code === "ENOENT") return null;
    throw err;
  }
}

async function writeCachedVector(cacheFile: string, vector: Float32Array): Promise<void> {
  const dir = path.dirname(cacheFile);
  await fs.mkdir(dir, { recursive: true });
  const buf = Buffer.from(vector.buffer, vector.byteOffset, vector.byteLength);
  await fs.writeFile(cacheFile, buf);
}

const memoryCache = new Map<string, Float32Array>();

export async function embedText(text: string, cacheKey: string, options: EmbedOptions): Promise<Float32Array> {
  const { model, dataDir, modelCacheDir } = options;
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey)!;
  }
  const cacheDir = path.join(dataDir, "embeddings");
  const cacheFile = path.join(cacheDir, `${hashString(cacheKey)}.bin`);
  const cached = await readCachedVector(cacheFile);
  if (cached) {
    memoryCache.set(cacheKey, cached);
    return cached;
  }

  const extractor = await loadExtractor(model, modelCacheDir);
  const output = await extractor(text, { pooling: "mean", normalize: true });
  const vector = Array.isArray(output.data)
    ? Float32Array.from(output.data as number[])
    : new Float32Array(output.data as Float32Array);
  await writeCachedVector(cacheFile, vector);
  memoryCache.set(cacheKey, vector);
  return vector;
}

export async function embedQuery(text: string, options: EmbedOptions): Promise<Float32Array> {
  const { model, modelCacheDir } = options;
  const extractor = await loadExtractor(model, modelCacheDir);
  const output = await extractor(text, { pooling: "mean", normalize: true });
  return Array.isArray(output.data)
    ? Float32Array.from(output.data as number[])
    : new Float32Array(output.data as Float32Array);
}
