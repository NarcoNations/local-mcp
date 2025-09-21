import { performance } from "node:perf_hooks";
import { sql } from "drizzle-orm";
import { db, documents, queries } from "../db/index.js";
import { getEmbeddingProvider } from "../core/embed/provider.js";
import { env } from "../config/env.js";
import { stripShortcodes } from "../core/text/shortcodes.js";
import { logger } from "../utils/logger.js";

export interface SearchFilters {
  author?: string;
  contentType?: string;
  slug?: string;
  tag?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface SearchResultItem {
  title: string;
  snippet: string;
  content_type: string;
  slug?: string;
  route_hint?: string;
  source_path: string;
  page_or_offset: { page?: number; offset?: number };
  tags: string[];
  updated?: string;
  confidence?: number;
  score: number;
}

export interface SearchResponse {
  query: string;
  top_k: number;
  results: SearchResultItem[];
}

export async function searchCorpus(query: string, topK = env.RESULTS_TOPK, filters: SearchFilters = {}): Promise<SearchResponse> {
  const start = performance.now();
  const provider = getEmbeddingProvider();
  const [embedding] = await provider.embed([query]);
  const embeddingLiteral = sql.raw(`'[${Array.from(embedding).join(",")}]'::vector`);

  const filterClauses = [] as ReturnType<typeof sql>[];
  if (filters.author) {
    filterClauses.push(sql`${documents.author} = ${filters.author}`);
  }
  if (filters.contentType) {
    filterClauses.push(sql`${documents.contentType} = ${filters.contentType}`);
  }
  if (filters.slug) {
    filterClauses.push(sql`${documents.slug} = ${filters.slug}`);
  }
  if (filters.tag) {
    filterClauses.push(sql`${documents.metaJson}->'tags' ? ${filters.tag}`);
  }
  if (filters.dateFrom) {
    filterClauses.push(sql`${documents.updatedAt} >= ${filters.dateFrom}`);
  }
  if (filters.dateTo) {
    filterClauses.push(sql`${documents.updatedAt} <= ${filters.dateTo}`);
  }

  const whereClause = filterClauses.length ? sql`WHERE ${sql.join(filterClauses, sql` AND `)}` : sql``;

  const rawResults = await db.execute(sql`
    WITH params AS (
      SELECT ${embeddingLiteral} AS query_embedding,
             websearch_to_tsquery('english', ${query}) AS query_ts,
             ${env.SEARCH_ALPHA}::float AS alpha
    )
    SELECT
      d.id,
      d.title,
      d.content_type,
      d.slug,
      d.route_hint,
      d.path_or_uri,
      d.meta_json,
      d.updated_at,
      d.confidence,
      c.text AS chunk_text,
      c.heading,
      c.page,
      c.offset_start,
      c.offset_end,
      (1 - (c.embedding <=> (SELECT query_embedding FROM params))) AS vector_score,
      ts_rank(c.tsv, (SELECT query_ts FROM params)) AS keyword_score
    FROM documents d
    JOIN chunks c ON c.document_id = d.id
    CROSS JOIN params
    ${whereClause}
    ORDER BY (SELECT alpha FROM params) * (1 - (c.embedding <=> (SELECT query_embedding FROM params))) +
             (1 - (SELECT alpha FROM params)) * ts_rank(c.tsv, (SELECT query_ts FROM params)) DESC
    LIMIT ${topK}
  `);

  const rows = (rawResults as unknown as { rows: any[] }).rows;
  const items: SearchResultItem[] = rows.map((row: any) => {
    const tags = Array.isArray(row.meta_json?.tags) ? (row.meta_json.tags as string[]) : [];
    const snippet = stripShortcodes(row.chunk_text).slice(0, 400);
    const page_or_offset = row.page
      ? { page: Number(row.page) }
      : { offset: row.offset_start ?? undefined };
    const alpha = env.SEARCH_ALPHA;
    const score = alpha * Number(row.vector_score ?? 0) + (1 - alpha) * Number(row.keyword_score ?? 0);
    return {
      title: row.title,
      snippet,
      content_type: row.content_type,
      slug: row.slug ?? undefined,
      route_hint: row.route_hint ?? undefined,
      source_path: row.path_or_uri,
      page_or_offset,
      tags,
      updated: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
      confidence: row.confidence ?? undefined,
      score,
    };
  });

  const latency = Math.round(performance.now() - start);
  const filtersJson = {
    ...filters,
    dateFrom: filters.dateFrom?.toISOString(),
    dateTo: filters.dateTo?.toISOString(),
  };

  await db.insert(queries).values({
    text: query,
    filtersJson,
    resultsJson: { count: items.length },
    latencyMs: latency,
    topK,
  });

  logger.info("search-completed", { query, topK, latency, hits: items.length });

  return {
    query,
    top_k: topK,
    results: items,
  };
}
