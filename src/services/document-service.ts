import { eq, inArray } from "drizzle-orm";
import { db, documents, links, sources } from "../db/index.js";
import type { Section } from "../importers/types.js";
import { readSections } from "../core/storage/sections-store.js";
import type { SourceKind } from "../importers/types.js";

export interface DocumentDetail {
  document: typeof documents.$inferSelect;
  sections: Section[];
}

export async function listSources(kind?: SourceKind) {
  if (kind) {
    return db.query.sources.findMany({ where: eq(sources.kind, kind) });
  }
  return db.query.sources.findMany();
}

export async function getDocumentDetail(documentId: string): Promise<DocumentDetail | null> {
  const doc = await db.query.documents.findFirst({ where: eq(documents.id, documentId) });
  if (!doc) return null;
  const sections = (await readSections(documentId)) ?? [];
  return { document: doc, sections };
}

export interface LinkInput {
  fromId: string;
  toId: string;
  relation: "supports" | "contradicts" | "related";
  note?: string;
}

export async function createLink(input: LinkInput) {
  await db.insert(links).values({
    fromChunkId: input.fromId,
    toChunkId: input.toId,
    relation: input.relation,
    note: input.note,
  });
}

export async function listDocumentsByIds(ids: string[]) {
  if (ids.length === 0) return [];
  const uniqueIds = Array.from(new Set(ids));
  return db.query.documents.findMany({ where: inArray(documents.id, uniqueIds) });
}
