import { pipeline } from '@xenova/transformers';

type Embedder = (input: string, options?: { pooling?: 'mean'; normalize?: boolean }) => Promise<any>;

let embedderPromise: Promise<Embedder> | null = null;

export async function getEmbedder() {
  if (!embedderPromise) {
    embedderPromise = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      quantized: true
    }) as Promise<Embedder>;
  }
  return embedderPromise;
}

export async function embedText(text: string) {
  const embedder = await getEmbedder();
  const tensor: any = await embedder(text, { pooling: 'mean', normalize: true });
  const data = tensor.data || tensor;
  if (Array.isArray(data)) return data as number[];
  if (data && typeof data.length === 'number') {
    return Array.from(data as Float32Array);
  }
  throw new Error('Unexpected embedding output');
}

export async function embedBatch(texts: string[]) {
  const results: number[][] = [];
  for (const text of texts) {
    results.push(await embedText(text));
  }
  return results;
}
