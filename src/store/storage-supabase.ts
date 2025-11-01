import crypto from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Chunk, FileIndexRecord, Manifest } from "../types.js";
import { logger } from "../utils/logger.js";

interface KnowledgeDocumentRow {
  id: string;
  path: string;
  checksum: string | null;
}

interface KnowledgeChunkRow {
  chunk_id: string;
}

interface SupabaseSyncConfig {
  slug: string;
  title: string;
  description?: string;
  manifestRetention: number;
}

function computeDigest(path: string, file: FileIndexRecord): string {
  const hash = crypto.createHash("sha256");
  hash.update(path);
  hash.update(String(file.mtime));
  hash.update(String(file.size));
  for (const id of file.chunkIds) {
    hash.update(id);
  }
  return hash.digest("hex");
}

function parseRetention(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.floor(parsed);
}

function toTimestamp(ms: number): string {
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
}

export class SupabaseSync {
  private client: SupabaseClient | null = null;
  private config: SupabaseSyncConfig;
  private sourceId: string | null = null;

  constructor() {
    const enabled = (process.env.SUPABASE_SYNC || "false").toLowerCase() === "true";
    const url = process.env.SUPABASE_URL;
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_KEY ||
      process.env.SUPABASE_ANON_KEY;

    this.config = {
      slug: process.env.SUPABASE_KNOWLEDGE_SLUG || "local-mcp",
      title: process.env.SUPABASE_KNOWLEDGE_TITLE || "Local MCP Knowledge",
      description: process.env.SUPABASE_KNOWLEDGE_DESCRIPTION,
      manifestRetention: parseRetention(process.env.SUPABASE_MANIFEST_RETENTION, 5),
    };

    if (!enabled) {
      logger.debug("supabase-sync-disabled", { reason: "env" });
      return;
    }

    if (!url || !key) {
      logger.warn("supabase-sync-missing-env", { url: Boolean(url), key: Boolean(key) });
      return;
    }

    this.client = createClient(url, key, { auth: { persistSession: false } });
  }

  get enabled(): boolean {
    return this.client !== null;
  }

  async sync(
    manifest: Manifest,
    chunks: Map<string, Chunk>,
    embeddings: Map<string, Float32Array>
  ): Promise<void> {
    if (!this.client) return;
    try {
      const sourceId = await this.ensureSource();
      const existingBefore = await this.fetchDocuments(sourceId);
      const previousChecksums = new Map<string, string | null>();
      existingBefore.forEach((doc) => previousChecksums.set(doc.path, doc.checksum));
      const files = Object.entries(manifest.files);
      if (files.length === 0) {
        await this.deleteStaleDocuments(sourceId, new Set());
        await this.recordManifest(sourceId, manifest);
        return;
      }

      const digests = new Map<string, string>();
      const documentsPayload = files.map(([path, file]) => {
        const checksum = computeDigest(path, file);
        digests.set(path, checksum);
        return {
          source_id: sourceId,
          path,
          checksum,
          size: file.size,
          mtime: toTimestamp(file.mtime),
          chunk_count: file.chunkIds.length,
          partial: Boolean(file.partial),
          kind: file.type,
          meta: { partial: Boolean(file.partial) },
        };
      });

      const { error: docError } = await this.client
        .from("knowledge_documents")
        .upsert(documentsPayload, { onConflict: "source_id,path" });
      if (docError) throw docError;

      const documents = await this.fetchDocuments(sourceId);
      const documentMap = new Map<string, KnowledgeDocumentRow>();
      documents.forEach((doc) => documentMap.set(doc.path, doc));

      await this.deleteStaleDocuments(sourceId, new Set(files.map(([path]) => path)));

      for (const [path, file] of files) {
        const doc = documentMap.get(path);
        if (!doc) continue;
        const digest = digests.get(path);
        const previous = previousChecksums.get(path);
        if (previous && digest && previous === digest) {
          continue; // unchanged
        }
        await this.syncChunks(doc.id, file, chunks, embeddings);
      }

      await this.recordManifest(sourceId, manifest);
    } catch (error) {
      logger.warn("supabase-sync-failed", { error: error instanceof Error ? error.message : String(error) });
    }
  }

  private async ensureSource(): Promise<string> {
    if (!this.client) throw new Error("Supabase client not configured");
    if (this.sourceId) return this.sourceId;
    const payload = {
      slug: this.config.slug,
      title: this.config.title,
      description: this.config.description ?? null,
    };
    const { data, error } = await this.client
      .from("knowledge_sources")
      .upsert(payload, { onConflict: "slug" })
      .select("id")
      .single();
    if (error) throw error;
    this.sourceId = data.id;
    return data.id;
  }

  private async fetchDocuments(sourceId: string): Promise<KnowledgeDocumentRow[]> {
    if (!this.client) return [];
    const { data, error } = await this.client
      .from("knowledge_documents")
      .select("id,path,checksum")
      .eq("source_id", sourceId);
    if (error) throw error;
    return data ?? [];
  }

  private async deleteStaleDocuments(sourceId: string, keep: Set<string>): Promise<void> {
    if (!this.client) return;
    const { data, error } = await this.client
      .from("knowledge_documents")
      .select("id,path")
      .eq("source_id", sourceId);
    if (error) throw error;
    const stale = (data ?? []).filter((doc) => !keep.has(doc.path));
    if (!stale.length) return;
    const ids = stale.map((doc) => doc.id);
    const { error: delError } = await this.client
      .from("knowledge_documents")
      .delete()
      .in("id", ids);
    if (delError) throw delError;
  }

  private async syncChunks(
    documentId: string,
    file: FileIndexRecord,
    chunks: Map<string, Chunk>,
    embeddings: Map<string, Float32Array>
  ): Promise<void> {
    if (!this.client) return;
    const chunkRows = file.chunkIds
      .map((chunkId, index) => {
        const chunk = chunks.get(chunkId);
        if (!chunk) return null;
        const vector = embeddings.get(chunkId);
        return {
          document_id: documentId,
          chunk_id: chunkId,
          chunk_index: index,
          content: chunk.text,
          token_count: chunk.tokens ?? null,
          offset_start: chunk.offsetStart ?? null,
          offset_end: chunk.offsetEnd ?? null,
          partial: Boolean(chunk.partial),
          embedding: vector ? Array.from(vector) : null,
          meta: {
            path: chunk.path,
            page: chunk.page ?? null,
            kind: chunk.type,
          },
        };
      })
      .filter((row): row is NonNullable<typeof row> => Boolean(row));

    const batchSize = 200;
    for (let i = 0; i < chunkRows.length; i += batchSize) {
      const slice = chunkRows.slice(i, i + batchSize);
      const { error } = await this.client
        .from("knowledge_chunks")
        .upsert(slice, { onConflict: "chunk_id" });
      if (error) throw error;
    }

    const { data: existing, error: existingError } = await this.client
      .from("knowledge_chunks")
      .select("chunk_id")
      .eq("document_id", documentId);
    if (existingError) throw existingError;
    const keepIds = new Set(file.chunkIds);
    const toDelete = (existing ?? []).filter((row: KnowledgeChunkRow) => !keepIds.has(row.chunk_id));
    if (toDelete.length) {
      const { error: delError } = await this.client
        .from("knowledge_chunks")
        .delete()
        .in(
          "chunk_id",
          toDelete.map((row) => row.chunk_id)
        );
      if (delError) throw delError;
    }
  }

  private async recordManifest(sourceId: string, manifest: Manifest): Promise<void> {
    if (!this.client) return;
    const payload = {
      source_id: sourceId,
      manifest,
      file_count: Object.keys(manifest.files).length,
      chunk_count: manifest.chunks,
      embedding_count: manifest.embeddingsCached,
    };
    const { error } = await this.client.from("knowledge_manifests").insert(payload);
    if (error) throw error;
    if (this.config.manifestRetention <= 0) return;
    const { data, error: listError } = await this.client
      .from("knowledge_manifests")
      .select("id")
      .eq("source_id", sourceId)
      .order("indexed_at", { ascending: false });
    if (listError) throw listError;
    const stale = ((data ?? []) as { id: string }[]).slice(this.config.manifestRetention);
    if (stale.length === 0) return;
    const ids = stale.map((row) => row.id);
    const { error: pruneError } = await this.client.from("knowledge_manifests").delete().in("id", ids);
    if (pruneError) throw pruneError;
  }
}
