import { eq } from "drizzle-orm";
import { db, documents, sources, chunks } from "../db/index.js";
import type { ImportResult } from "../importers/index.js";
import { importFile } from "../importers/index.js";
import { logger } from "../utils/logger.js";
import { deleteSections, writeSections } from "../core/storage/sections-store.js";

export interface ImportSummary {
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
}

export async function importPaths(paths: string[]): Promise<ImportSummary> {
  const summary: ImportSummary = { inserted: 0, updated: 0, skipped: 0, errors: 0 };
  for (const filePath of paths) {
    try {
      const results = await importFile(filePath);
      if (results.length === 0) {
        logger.warn("import-no-parser", { path: filePath });
        summary.skipped++;
        continue;
      }
      for (const result of results) {
        await processImport(result, summary);
      }
    } catch (error) {
      summary.errors++;
      logger.error("import-failed", { path: filePath, err: error instanceof Error ? error.message : String(error) });
    }
  }
  return summary;
}

async function processImport(result: ImportResult, summary: ImportSummary): Promise<void> {
  const sourceId = await ensureSource(result);
  const existingByHash = await db.query.documents.findFirst({
    where: eq(documents.contentHash, result.contentHash),
  });
  if (existingByHash) {
    summary.skipped++;
    return;
  }

  const existingByPath = await db.query.documents.findFirst({
    where: eq(documents.pathOrUri, result.document.pathOrUri),
  });

  if (existingByPath) {
    await deleteSections(existingByPath.id);
    const sectionsPath = await writeSections(existingByPath.id, result.sections);
    await db
      .update(documents)
      .set({
        sourceId,
        title: result.document.title,
        author: result.document.author,
        updatedAt: result.document.updatedAt ?? existingByPath.updatedAt,
        contentHash: result.contentHash,
        contentType: result.document.contentType,
        slug: result.document.slug,
        routeHint: result.document.routeHint,
        heroImage: result.document.heroImage,
        metaJson: {
          ...result.document.meta,
          sectionsPath,
        },
        confidence: result.document.confidence ?? existingByPath.confidence,
      })
      .where(eq(documents.id, existingByPath.id));
    await db.delete(chunks).where(eq(chunks.documentId, existingByPath.id));
    summary.updated++;
    return;
  }

  await db.insert(documents).values({
    sourceId,
    title: result.document.title,
    pathOrUri: result.document.pathOrUri,
    author: result.document.author,
    createdAt: result.document.createdAt ?? new Date(),
    updatedAt: result.document.updatedAt,
    contentHash: result.contentHash,
    contentType: result.document.contentType,
    slug: result.document.slug,
    routeHint: result.document.routeHint,
    heroImage: result.document.heroImage,
    metaJson: result.document.meta,
    confidence: result.document.confidence,
  });
  const insertedDoc = await db.query.documents.findFirst({
    where: eq(documents.contentHash, result.contentHash),
  });
  const newId = insertedDoc?.id;
  if (!newId) {
    summary.errors++;
    logger.error("import-insert-missing-id", { path: result.document.pathOrUri });
    return;
  }
  const sectionsPath = await writeSections(newId, result.sections);
  await db
    .update(documents)
    .set({ metaJson: { ...result.document.meta, sectionsPath } })
    .where(eq(documents.id, newId));
  summary.inserted++;
}

async function ensureSource(result: ImportResult): Promise<number> {
  const existing = await db.query.sources.findFirst({
    where: eq(sources.origin, result.source.origin),
  });
  if (existing) {
    return existing.id;
  }
  await db
    .insert(sources)
    .values({
      kind: result.source.kind,
      origin: result.source.origin,
      grade: result.source.grade,
    });
  const inserted = await db.query.sources.findFirst({
    where: eq(sources.origin, result.source.origin),
  });
  return inserted?.id ?? 0;
}
