import { promises as fs } from "fs";
import path from "path";
import { AppConfig, Chunk } from "../types.js";
import { logger } from "../utils/logger.js";
import { CURRENT_MANIFEST_VERSION, ManifestData } from "./schema.js";
import { FlatVectorStore, VectorRecord } from "./vector-flat.js";
import { createSQLiteVectorStore, SQLiteVectorStore } from "./vector-sqlitevss.js";
import { KeywordStore } from "./keyword.js";

export interface UpsertPayload {
  filePath: string;
  hash: string;
  chunks: Chunk[];
  vectors: VectorRecord[];
  partial?: boolean;
}

export interface HybridOptions {
  k: number;
  alpha: number;
  keywordLimit: number;
  denseLimit: number;
  filterTypes?: Set<string>;
}

export interface HybridResult {
  id: string;
  score: number;
}

export class Store {
  private manifest: ManifestData = {
    version: CURRENT_MANIFEST_VERSION,
    files: {},
    chunks: {},
    stats: { updatedAt: null },
  };
  private vectorStore!: FlatVectorStore;
  private sqliteStore: SQLiteVectorStore | null = null;
  private keywordStore = new KeywordStore();

  private constructor(private readonly config: AppConfig) {}

  static async load(config: AppConfig): Promise<Store> {
    const store = new Store(config);
    await store.init();
    return store;
  }

  private get manifestPath(): string {
    return path.join(this.config.out.dataDir, "manifest.json");
  }

  private async init(): Promise<void> {
    await fs.mkdir(this.config.out.dataDir, { recursive: true });
    try {
      const raw = await fs.readFile(this.manifestPath, "utf8");
      this.manifest = JSON.parse(raw) as ManifestData;
    } catch (err: any) {
      if (err.code !== "ENOENT") {
        logger.warn("manifest-load-failed", { error: err.message });
      }
    }

    this.vectorStore = await FlatVectorStore.create(this.config.out.dataDir);
    if (this.config.index.useSQLiteVSS) {
      this.sqliteStore = await createSQLiteVectorStore(this.config.out.dataDir);
    }

    // Rebuild keyword index from manifest
    const chunks = Object.values(this.manifest.chunks ?? {});
    if (chunks.length) {
      this.keywordStore.upsert(chunks);
    }
  }

  private async persistManifest(): Promise<void> {
    await fs.writeFile(this.manifestPath, JSON.stringify(this.manifest, null, 2));
  }

  private async removeChunks(chunkIds: string[]): Promise<void> {
    for (const id of chunkIds) {
      delete this.manifest.chunks[id];
    }
    this.vectorStore.remove(chunkIds);
    this.keywordStore.remove(chunkIds);
    if (this.sqliteStore) {
      await this.sqliteStore.remove(chunkIds);
    }
  }

  async upsert(payload: UpsertPayload): Promise<void> {
    const { filePath, hash, chunks, vectors, partial } = payload;
    const previous = this.manifest.files[filePath];
    if (previous) {
      await this.removeChunks(previous.chunkIds);
    }

    this.manifest.files[filePath] = {
      path: filePath,
      type: chunks[0]?.type ?? "unknown",
      chunkIds: chunks.map((chunk) => chunk.id),
      mtime: chunks[0]?.mtime ?? Date.now(),
      hash,
      partial,
    };
    for (const chunk of chunks) {
      this.manifest.chunks[chunk.id] = chunk;
    }
    this.keywordStore.upsert(chunks);
    await this.vectorStore.upsert(vectors);
    if (this.sqliteStore) {
      await this.sqliteStore.upsert(vectors);
    }
    this.manifest.stats.updatedAt = Date.now();
    await this.persistManifest();
  }

  async remove(filePath: string): Promise<void> {
    const record = this.manifest.files[filePath];
    if (!record) return;
    await this.removeChunks(record.chunkIds);
    delete this.manifest.files[filePath];
    this.manifest.stats.updatedAt = Date.now();
    await this.persistManifest();
  }

  getChunk(id: string): Chunk | undefined {
    return this.manifest.chunks[id];
  }

  getChunks(ids: string[]): Chunk[] {
    return ids.map((id) => this.manifest.chunks[id]).filter(Boolean) as Chunk[];
  }

  getFileRecord(pathKey: string) {
    return this.manifest.files[pathKey];
  }

  listFiles(): string[] {
    return Object.keys(this.manifest.files);
  }

  getChunkCount(): number {
    return Object.keys(this.manifest.chunks).length;
  }

  getChunksByType(): Record<string, number> {
    const tally: Record<string, number> = {};
    for (const record of Object.values(this.manifest.files)) {
      const count = tally[record.type] ?? 0;
      tally[record.type] = count + record.chunkIds.length;
    }
    return tally;
  }

  getLastUpdated(): number | null {
    return this.manifest.stats.updatedAt ?? null;
  }

  getVectorCount(): number {
    return this.vectorStore.size();
  }

  searchKeyword(query: string, limit: number): Array<{ id: string; score: number }> {
    return this.keywordStore.search(query, limit);
  }

  searchDense(vector: Float32Array, limit: number): Array<{ id: string; score: number }> {
    return this.sqliteStore ? [] : this.vectorStore.search(vector, limit);
  }

  async searchDenseWithSQLite(vector: Float32Array, limit: number): Promise<Array<{ id: string; score: number }>> {
    if (this.sqliteStore) {
      return this.sqliteStore.search(vector, limit);
    }
    return this.vectorStore.search(vector, limit);
  }

  async hybrid(vector: Float32Array, query: string, options: HybridOptions): Promise<HybridResult[]> {
    const { k, alpha, keywordLimit, denseLimit, filterTypes } = options;
    const dense = await this.searchDenseWithSQLite(vector, denseLimit);
    const keyword = this.searchKeyword(query, keywordLimit);

    const denseMax = dense[0]?.score ?? 1;
    const keywordMax = keyword[0]?.score ?? 1;
    const scores = new Map<string, number>();

    for (const hit of dense) {
      const chunk = this.getChunk(hit.id);
      if (filterTypes && chunk && !filterTypes.has(chunk.type)) continue;
      const base = scores.get(hit.id) ?? 0;
      const normalized = denseMax ? hit.score / denseMax : hit.score;
      scores.set(hit.id, Math.max(base, alpha * normalized));
    }

    for (const hit of keyword) {
      const chunk = this.getChunk(hit.id);
      if (filterTypes && chunk && !filterTypes.has(chunk.type)) continue;
      const base = scores.get(hit.id) ?? 0;
      const normalized = keywordMax ? hit.score / keywordMax : hit.score;
      scores.set(hit.id, base + (1 - alpha) * normalized);
    }

    return Array.from(scores.entries())
      .map(([id, score]) => ({ id, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }
}
