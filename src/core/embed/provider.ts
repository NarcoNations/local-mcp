import { pipeline, type FeatureExtractionPipeline } from "@xenova/transformers";
import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";

export interface EmbeddingProvider {
  embed(texts: string[]): Promise<Float32Array[]>;
}

class LocalEmbeddingProvider implements EmbeddingProvider {
  private extractorPromise: Promise<FeatureExtractionPipeline> | null = null;

  private async getExtractor(): Promise<FeatureExtractionPipeline> {
    if (!this.extractorPromise) {
      logger.info("embedding-model-load", { model: env.EMBED_MODEL });
      this.extractorPromise = pipeline("feature-extraction", env.EMBED_MODEL, {
        progress_callback: () => {},
      }) as Promise<FeatureExtractionPipeline>;
    }
    return this.extractorPromise;
  }

  async embed(texts: string[]): Promise<Float32Array[]> {
    const extractor = await this.getExtractor();
    const outputs: Float32Array[] = [];
    for (const text of texts) {
      const output = await extractor(text, { pooling: "mean", normalize: true });
      const vector = Array.isArray(output.data)
        ? Float32Array.from(output.data as number[])
        : new Float32Array(output.data as Float32Array);
      outputs.push(vector);
    }
    return outputs;
  }
}

class OpenAIEmbeddingProvider implements EmbeddingProvider {
  async embed(texts: string[]): Promise<Float32Array[]> {
    if (!env.API_KEY) {
      throw new Error("OPENAI_API_KEY (API_KEY) is required for OpenAI embeddings");
    }
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.API_KEY}`,
      },
      body: JSON.stringify({
        input: texts,
        model: env.EMBED_MODEL,
      }),
    });
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenAI embedding failed: ${response.status} ${errorBody}`);
    }
    const json = (await response.json()) as {
      data: Array<{ embedding: number[] }>;
    };
    return json.data.map((item) => Float32Array.from(item.embedding));
  }
}

let provider: EmbeddingProvider | null = null;

export function getEmbeddingProvider(): EmbeddingProvider {
  if (!provider) {
    provider = env.EMBED_PROVIDER === "local" ? new LocalEmbeddingProvider() : new OpenAIEmbeddingProvider();
  }
  return provider;
}
