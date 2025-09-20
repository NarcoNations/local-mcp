import { z } from "zod";
import { AppConfig } from "../config.js";
import { embedQuery } from "../pipeline/embed.js";
import { getStore } from "../store/store.js";
import { buildCitation } from "../utils/cite.js";

export const SearchLocalShape = {
  query: z.string().min(1),
  k: z.number().min(1).max(32).default(8),
  alpha: z.number().min(0).max(1).default(0.65),
  filters: z
    .object({
      type: z.array(z.enum(["pdf", "markdown", "text", "word", "pages"])).optional(),
    })
    .optional(),
};

export const SearchLocalInputSchema = z.object(SearchLocalShape);

function normaliseScores(hits: { id: string; score: number }[]): Map<string, number> {
  const map = new Map<string, number>();
  if (hits.length === 0) return map;
  const scores = hits.map((hit) => hit.score);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min;
  for (const hit of hits) {
    const value = range > 0 ? (hit.score - min) / range : 1;
    map.set(hit.id, value);
  }
  return map;
}

export function createSearchLocalTool(config: AppConfig) {
  return async function searchLocal(input: unknown) {
    const parsed = SearchLocalInputSchema.parse(input);
    const store = await getStore(config);
    const vector = await embedQuery(parsed.query, {
      model: config.index.model,
      dataDir: config.out.dataDir,
      modelCacheDir: config.out.modelCacheDir,
    });
    const denseHits = store.searchDense(vector, parsed.k * 2);
    const keywordHits = store.searchKeyword(parsed.query, parsed.k * 2);

    const filterTypes = parsed.filters?.type;
    const denseNorm = normaliseScores(denseHits.map((h) => ({ id: h.chunk.id, score: h.score })));
    const keywordNorm = normaliseScores(keywordHits.map((h) => ({ id: h.chunk.id, score: h.score })));
    const combined = new Map<string, { chunk: typeof denseHits[number]["chunk"]; score: number }>();

    for (const hit of denseHits) {
      if (filterTypes && !filterTypes.includes(hit.chunk.type)) continue;
      const keywordScore = keywordNorm.get(hit.chunk.id) ?? 0;
      const denseScore = denseNorm.get(hit.chunk.id) ?? 0;
      const score = parsed.alpha * denseScore + (1 - parsed.alpha) * keywordScore;
      combined.set(hit.chunk.id, { chunk: hit.chunk, score });
    }
    for (const hit of keywordHits) {
      if (filterTypes && !filterTypes.includes(hit.chunk.type)) continue;
      if (combined.has(hit.chunk.id)) continue;
      const keywordScore = keywordNorm.get(hit.chunk.id) ?? 0;
      const denseScore = denseNorm.get(hit.chunk.id) ?? 0;
      const score = parsed.alpha * denseScore + (1 - parsed.alpha) * keywordScore;
      combined.set(hit.chunk.id, { chunk: hit.chunk, score });
    }

    const sorted = Array.from(combined.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, parsed.k)
      .map(({ chunk, score }) => ({
        chunkId: chunk.id,
        score,
        text: chunk.text.slice(0, 600),
        citation: buildCitation(chunk.path, chunk.page, chunk.text, chunk.offsetStart, chunk.offsetEnd),
      }));

    return { query: parsed.query, results: sorted };
  };
}
