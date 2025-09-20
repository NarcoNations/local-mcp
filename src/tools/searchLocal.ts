import { z } from "zod";
import { AppContext } from "../app.js";
import { buildSnippet } from "../utils/cite.js";
import { ChunkType } from "../types.js";

const chunkTypes = ["pdf", "markdown", "text", "word", "pages"] as const;

const InputSchema = z.object({
  query: z.string().min(1),
  k: z.number().int().min(1).max(32).default(8),
  alpha: z.number().min(0).max(1).default(0.65),
  filters: z
    .object({
      type: z.array(z.enum(chunkTypes)).optional(),
    })
    .optional(),
});

interface SearchResult {
  chunkId: string;
  score: number;
  text: string;
  citation: {
    filePath: string;
    page?: number;
    startChar?: number;
    endChar?: number;
    snippet: string;
  };
}

export async function searchLocal(context: AppContext, input: unknown) {
  const { store, embedder } = context;
  const { query, k, alpha, filters } = InputSchema.parse(input ?? {});
  const vector = await embedder.embedQuery(query);
  const filterTypes: Set<ChunkType> | undefined = filters?.type ? new Set(filters.type) : undefined;
  const hits = await store.hybrid(vector, query, {
    k,
    alpha,
    keywordLimit: Math.max(16, k * 4),
    denseLimit: Math.max(16, k * 4),
    filterTypes,
  });

  const results = hits
    .map((hit): SearchResult | null => {
      const chunk = store.getChunk(hit.id);
      if (!chunk) {
        return null;
      }
      const citation = {
        filePath: chunk.path,
        page: chunk.page,
        startChar: chunk.offsetStart,
        endChar: chunk.offsetEnd,
        snippet: buildSnippet(chunk.text, chunk.offsetStart, chunk.offsetEnd),
      };
      return {
        chunkId: chunk.id,
        score: hit.score,
        text: chunk.text.slice(0, 600),
        citation,
      };
    })
    .filter((entry): entry is SearchResult => entry !== null);

  return {
    query,
    results,
  };
}
