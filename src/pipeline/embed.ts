import { pipeline } from "@xenova/transformers";
import { AppConfig } from "../config.js";
import { debug } from "../utils/logger.js";

export interface EmbeddingOptions {
  concurrency: number;
}

type Extractor = (text: string, options: { pooling: "mean"; normalize: boolean }) => Promise<{ data: Float32Array }>;

class EmbeddingPipeline {
  private extractor?: Extractor;
  private loading?: Promise<Extractor>;
  private active = 0;
  private readonly waiters: (() => void)[] = [];
  private readonly concurrency: number;
  private readonly model: string;
  private readonly modelCacheDir?: string;

  constructor(model: string, concurrency: number, modelCacheDir?: string) {
    this.model = model;
    this.concurrency = Math.max(1, concurrency);
    this.modelCacheDir = modelCacheDir;
  }

  private async load(): Promise<Extractor> {
    if (this.extractor) return this.extractor;
    if (!this.loading) {
      this.loading = (async () => {
        if (this.modelCacheDir && !process.env.TRANSFORMERS_CACHE) {
          process.env.TRANSFORMERS_CACHE = this.modelCacheDir;
        }
        process.stdout.write(
          JSON.stringify({ event: "model", status: "loading", model: this.model }) + "\n"
        );
        const instance = (await pipeline("feature-extraction", this.model)) as Extractor;
        process.stdout.write(
          JSON.stringify({ event: "model", status: "ready", model: this.model }) + "\n"
        );
        this.extractor = instance;
        return instance;
      })();
    }
    return this.loading;
  }

  private async acquire(): Promise<void> {
    if (this.active < this.concurrency) {
      this.active += 1;
      return;
    }
    await new Promise<void>((resolve) => this.waiters.push(resolve));
    this.active += 1;
  }

  private release(): void {
    this.active = Math.max(0, this.active - 1);
    const waiter = this.waiters.shift();
    if (waiter) waiter();
  }

  async embed(text: string): Promise<Float32Array> {
    await this.acquire();
    try {
      const extractor = await this.load();
      const result = await extractor(text, { pooling: "mean", normalize: true });
      return new Float32Array(result.data);
    } finally {
      this.release();
    }
  }
}

let instance: EmbeddingPipeline | undefined;

export function getEmbedder(config: AppConfig): EmbeddingPipeline {
  if (!instance) {
    const concurrency = config.index.concurrency ?? 2;
    instance = new EmbeddingPipeline(config.index.model, concurrency, config.out.modelCacheDir);
    debug("embedder-init", { model: config.index.model, concurrency });
  }
  return instance;
}
