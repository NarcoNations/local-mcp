import path from "path";
import type { AppConfig } from "../types.js";

type Extractor = (text: string, options: Record<string, unknown>) => Promise<{ data: Float32Array }>;

let extractorPromise: Promise<Extractor> | undefined;

function emitModelEvent(status: string) {
  if (!process.stdout.writable) return;
  process.stdout.write(`${JSON.stringify({ event: "model", status })}\n`);
}

async function loadExtractor(config: AppConfig): Promise<Extractor> {
  if (!extractorPromise) {
    extractorPromise = (async () => {
      emitModelEvent("loading");
      const transformers = await import("@xenova/transformers");
      const pipelineFactory = (transformers as any).pipeline;
      const options: Record<string, unknown> = {};
      const modelCache = config.out.modelCacheDir;
      if (modelCache) {
        options.cache_dir = path.resolve(modelCache);
      }
      const pipe = await pipelineFactory("feature-extraction", config.index.model, options);
      emitModelEvent("ready");
      return async (text: string, opts: Record<string, unknown>) => {
        const result = await pipe(text, opts);
        return { data: result.data as Float32Array };
      };
    })();
  }
  return extractorPromise;
}

export class EmbeddingService {
  constructor(private config: AppConfig) {}

  async embed(text: string): Promise<Float32Array> {
    const extractor = await loadExtractor(this.config);
    const output = await extractor(text, { pooling: "mean", normalize: true });
    return output.data;
  }
}

let instance: EmbeddingService | undefined;

export function getEmbeddingService(config: AppConfig): EmbeddingService {
  if (!instance) {
    instance = new EmbeddingService(config);
  }
  return instance;
}
