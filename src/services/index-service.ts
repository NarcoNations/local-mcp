import { sql, eq } from "drizzle-orm";
import { db, documents, chunks } from "../db/index.js";
import type { Document } from "../db/index.js";
import { readSections } from "../core/storage/sections-store.js";
import { chunkSections } from "../core/chunking/chunker.js";
import { getEmbeddingProvider } from "../core/embed/provider.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

export interface IndexSummary {
  indexedDocuments: number;
  indexedChunks: number;
  skipped: number;
  errors: number;
}

export async function indexPendingDocuments(limit = 10): Promise<IndexSummary> {
  const summary: IndexSummary = { indexedDocuments: 0, indexedChunks: 0, skipped: 0, errors: 0 };
  const pending = await db.execute(
    sql`SELECT d.* FROM documents d LEFT JOIN chunks c ON c.document_id = d.id GROUP BY d.id HAVING COUNT(c.id) = 0 ORDER BY d.updated_at NULLS LAST LIMIT ${limit}`
  );
  const rows = (pending as unknown as { rows: Document[] }).rows;
  const provider = getEmbeddingProvider();

  for (const row of rows) {
    try {
      const sections = await readSections(row.id);
      if (!sections || sections.length === 0) {
        summary.skipped++;
        logger.warn("index-sections-missing", { documentId: row.id });
        continue;
      }
      const chunkOutputs = chunkSections(sections, {
        chunkTokens: env.CHUNK_TOKENS,
        overlapTokens: env.CHUNK_OVERLAP,
      });
      if (chunkOutputs.length === 0) {
        summary.skipped++;
        continue;
      }
      const embeddings = await provider.embed(chunkOutputs.map((chunk) => chunk.text));
      const values = chunkOutputs.map((chunk, idx) => ({
        documentId: row.id,
        ordinal: chunk.ordinal,
        heading: chunk.heading,
        text: chunk.text,
        tokenCount: chunk.tokenCount,
        embedding: Array.from(embeddings[idx]),
        page: chunk.page ?? null,
        offsetStart: chunk.offsetStart,
        offsetEnd: chunk.offsetEnd,
        tsv: sql`to_tsvector('english', ${chunk.text})`,
      }));
      for (const value of values) {
        await db.insert(chunks).values(value as any);
      }
      summary.indexedDocuments++;
      summary.indexedChunks += values.length;
    } catch (error) {
      summary.errors++;
      logger.error("index-document-failed", { documentId: row.id, err: error instanceof Error ? error.message : String(error) });
      await db.delete(chunks).where(eq(chunks.documentId, row.id));
    }
  }

  return summary;
}
