import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  index,
  customType,
} from "drizzle-orm/pg-core";
import { InferModel } from "drizzle-orm";
import { sql } from "drizzle-orm";

export const sourceKindEnum = pgEnum("source_kind", ["chat_export", "file", "url"]);
export const linkRelationEnum = pgEnum("link_relation", ["supports", "contradicts", "related"]);
export const sourceGradeEnum = pgEnum("source_grade", ["A", "B", "C"]);

const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

const vector = customType<{ data: number[] }>({
  dataType() {
    return "vector(1536)";
  },
});

export const sources = pgTable(
  "sources",
  {
    id: serial("id").primaryKey(),
    kind: sourceKindEnum("kind").notNull(),
    origin: text("origin").notNull(),
    collectedAt: timestamp("collected_at", { withTimezone: true }).defaultNow().notNull(),
    grade: sourceGradeEnum("grade"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdateFn(() => sql`now()`),
  }
);

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sourceId: integer("source_id")
      .references(() => sources.id, { onDelete: "cascade" })
      .notNull(),
    title: text("title").notNull(),
    pathOrUri: text("path_or_uri").notNull(),
    author: text("author"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
    contentHash: text("content_hash").notNull(),
    contentType: text("content_type").notNull(),
    slug: text("slug"),
    routeHint: text("route_hint"),
    heroImage: text("hero_image"),
    metaJson: jsonb("meta_json").$type<Record<string, unknown>>().default(sql`'{}'::jsonb`).notNull(),
    confidence: real("confidence"),
  },
  (table) => ({
    contentHashKey: uniqueIndex("documents_content_hash_key").on(table.contentHash),
    slugIdx: index("documents_slug_idx").on(table.slug),
    contentTypeIdx: index("documents_content_type_idx").on(table.contentType),
  })
);

export const chunks = pgTable(
  "chunks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    documentId: uuid("document_id")
      .references(() => documents.id, { onDelete: "cascade" })
      .notNull(),
    ordinal: integer("ordinal").notNull(),
    heading: text("heading"),
    text: text("text").notNull(),
    tokenCount: integer("token_count").notNull(),
    embedding: vector("embedding").notNull(),
    tsv: tsvector("tsv").notNull(),
    page: integer("page"),
    offsetStart: integer("offset_start"),
    offsetEnd: integer("offset_end"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    documentIdx: index("chunks_document_idx").on(table.documentId),
  })
);

export const links = pgTable(
  "links",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fromChunkId: uuid("from_chunk_id")
      .references(() => chunks.id, { onDelete: "cascade" })
      .notNull(),
    toChunkId: uuid("to_chunk_id")
      .references(() => chunks.id, { onDelete: "cascade" })
      .notNull(),
    relation: linkRelationEnum("relation").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  }
);

export const queries = pgTable(
  "queries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    text: text("text").notNull(),
    filtersJson: jsonb("filters_json").$type<Record<string, unknown>>().default(sql`'{}'::jsonb`).notNull(),
    resultsJson: jsonb("results_json").$type<Record<string, unknown>>().default(sql`'{}'::jsonb`).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    latencyMs: integer("latency_ms").notNull(),
    topK: integer("topk").notNull(),
  }
);

export type Source = InferModel<typeof sources>;
export type InsertSource = InferModel<typeof sources, "insert">;
export type Document = InferModel<typeof documents>;
export type InsertDocument = InferModel<typeof documents, "insert">;
export type Chunk = InferModel<typeof chunks>;
export type InsertChunk = InferModel<typeof chunks, "insert">;
export type Link = InferModel<typeof links>;
export type InsertLink = InferModel<typeof links, "insert">;
export type QueryLog = InferModel<typeof queries>;
export type InsertQueryLog = InferModel<typeof queries, "insert">;
