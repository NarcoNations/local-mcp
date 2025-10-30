import { pipeline } from '@xenova/transformers';

export type EmbeddingArray = number[];

type Embedder = (text: string) => Promise<EmbeddingArray>;

let embedderPromise: Promise<Embedder> | null = null;

async function loadEmbedder(): Promise<Embedder> {
  if (!embedderPromise) {
    const model = process.env.EMBEDDING_MODEL || 'Xenova/all-MiniLM-L6-v2';
    embedderPromise = pipeline('feature-extraction', model, { quantized: true }).then((fn: any) => {
      if (!fn) throw new Error('Failed to initialize embedding pipeline');
      return async (text: string) => {
        const output = await fn(text, { pooling: 'mean', normalize: true });
        const data: Float32Array | undefined = output?.data;
        if (!data) throw new Error('Embedding output missing data');
        return Array.from(data);
      };
    });
  }
  return embedderPromise;
}

export async function embedText(text: string): Promise<EmbeddingArray> {
  if (!text || !text.trim()) throw new Error('Cannot embed empty text');
  const embed = await loadEmbedder();
  return embed(text.trim());
}

export async function ensureEmbedderReady() {
  await loadEmbedder();
}
