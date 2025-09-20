import { promises as fs } from "fs";
import path from "path";
import fg from "fast-glob";
import { AppConfig } from "../config.js";
import { buildSnippet } from "../utils/cite.js";
import { FSGuard } from "../utils/fs-guard.js";
import { checksumStream } from "../utils/hash.js";
import { debug, info } from "../utils/logger.js";
import { now } from "../utils/time.js";
import { getEmbedder } from "../pipeline/embed.js";
import { indexFile, IndexedFile } from "../indexers/index.js";
import { Chunk, HybridSearchOptions, Manifest, SearchHit, StoreStats } from "../types.js";
import { CHUNKS_FILE, MANIFEST_FILE, MANIFEST_VERSION } from "./schema.js";
import { FlatVectorStore } from "./vector-flat.js";
import { createSQLiteVectorStore } from "./vector-sqlitevss.js";
import { KeywordStore } from "./keyword.js";

const emptyManifest = (): Manifest => ({
  version: MANIFEST_VERSION,
  files: {},
  byType: {
    pdf: 0,
    markdown: 0,
    text: 0,
    word: 0,
    pages: 0
  },
  totalChunks: 0,
  totalFiles: 0,
  lastIndexedAt: undefined
});

export class Store {
  private readonly config: AppConfig;
  private readonly dataDir: string;
  private readonly manifestPath: string;
  private readonly chunksPath: string;
  private manifest: Manifest = emptyManifest();
  private chunks = new Map<string, Chunk>();
  private readonly vector: FlatVectorStore;
  private sqlite: Awaited<ReturnType<typeof createSQLiteVectorStore>> | null = null;
  private readonly keyword: KeywordStore;

  private constructor(config: AppConfig) {
    this.config = config;
    this.dataDir = config.out.dataDir;
    this.manifestPath = path.join(this.dataDir, MANIFEST_FILE);
    this.chunksPath = path.join(this.dataDir, CHUNKS_FILE);
    this.vector = new FlatVectorStore(this.dataDir);
    this.keyword = new KeywordStore(this.dataDir);
  }

  getConfig(): AppConfig {
    return this.config;
  }

  static async init(config: AppConfig): Promise<Store> {
    const store = new Store(config);
    await fs.mkdir(config.out.dataDir, { recursive: true });
    await store.loadManifest();
    await store.loadChunks();
    await store.vector.load();
    await store.keyword.load();
    store.sqlite = await createSQLiteVectorStore(config.out.dataDir);
    return store;
  }

  private async loadManifest(): Promise<void> {
    try {
      const raw = await fs.readFile(this.manifestPath, "utf8");
      const parsed = JSON.parse(raw) as Manifest;
      if (parsed.version !== MANIFEST_VERSION) {
        this.manifest = emptyManifest();
      } else {
        this.manifest = parsed;
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      this.manifest = emptyManifest();
    }
  }

  private async loadChunks(): Promise<void> {
    try {
      const raw = await fs.readFile(this.chunksPath, "utf8");
      const parsed = JSON.parse(raw) as Chunk[];
      this.chunks = new Map(parsed.map((chunk) => [chunk.id, chunk]));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      this.chunks = new Map();
    }
  }

  private async persist(): Promise<void> {
    await fs.mkdir(this.dataDir, { recursive: true });
    await fs.writeFile(this.manifestPath, JSON.stringify(this.manifest, null, 2), "utf8");
    await fs.writeFile(this.chunksPath, JSON.stringify(Array.from(this.chunks.values()), null, 2), "utf8");
  }

  private recomputeCounts(): void {
    const byType = {
      pdf: 0,
      markdown: 0,
      text: 0,
      word: 0,
      pages: 0
    } as Manifest["byType"];
    for (const chunk of this.chunks.values()) {
      byType[chunk.type] += 1;
    }
    this.manifest.byType = byType;
    this.manifest.totalChunks = this.chunks.size;
    this.manifest.totalFiles = Object.keys(this.manifest.files).length;
  }

  private toSearchHit(id: string, score: number): SearchHit | undefined {
    const chunk = this.chunks.get(id);
    if (!chunk) return undefined;
    const snippet = buildSnippet(chunk.text, chunk.offsetStart, chunk.offsetEnd);
    return {
      chunkId: id,
      score,
      text: chunk.text.slice(0, 600),
      citation: {
        filePath: chunk.path,
        page: chunk.page,
        startChar: chunk.offsetStart,
        endChar: chunk.offsetEnd,
        snippet
      }
    };
  }

  async searchDense(query: string, k: number): Promise<SearchHit[]> {
    const embedder = getEmbedder(this.config);
    const vector = await embedder.embed(query);
    const hits = this.vector.search(vector, Math.max(k, 64));
    const mapped = hits
      .map((hit) => this.toSearchHit(hit.id, hit.score))
      .filter((hit): hit is SearchHit => Boolean(hit));
    return mapped.slice(0, k);
  }

  searchBM25(query: string, k: number): SearchHit[] {
    const hits = this.keyword.search(query, Math.max(k, 64));
    const mapped = hits
      .map((hit) => this.toSearchHit(hit.id, hit.score))
      .filter((hit): hit is SearchHit => Boolean(hit));
    return mapped.slice(0, k);
  }

  async hybridSearch(options: HybridSearchOptions): Promise<SearchHit[]> {
    const { query, k, alpha } = options;
    const dense = await this.searchDense(query, Math.max(k, 64));
    const bm25 = this.searchBM25(query, Math.max(k, 64));
    const denseMax = dense[0]?.score ?? 1;
    const bm25Max = bm25[0]?.score ?? 1;
    const combined = new Map<string, number>();
    for (const hit of dense) {
      combined.set(hit.chunkId, (hit.score / denseMax) * alpha);
    }
    for (const hit of bm25) {
      const base = combined.get(hit.chunkId) ?? 0;
      combined.set(hit.chunkId, base + (hit.score / bm25Max) * (1 - alpha));
    }
    const hits = Array.from(combined.entries())
      .map(([id, score]) => this.toSearchHit(id, score))
      .filter((hit): hit is SearchHit => Boolean(hit))
      .sort((a, b) => b.score - a.score);
    const filtered = options.filters?.type
      ? hits.filter((hit) => options.filters?.type?.includes(this.chunks.get(hit.chunkId)?.type as any))
      : hits;
    return filtered.slice(0, k);
  }

  async upsertFile(filePath: string, indexed: IndexedFile): Promise<{ skipped: boolean; chunkCount: number }> {
    const chunkIds = indexed.chunks.map((chunk) => chunk.id);
    const checksum = checksumStream(indexed.chunks.map((chunk) => chunk.text));
    const existing = this.manifest.files[filePath];
    if (existing && existing.checksum === checksum && existing.mtime === indexed.mtime) {
      return { skipped: true, chunkCount: existing.chunkIds.length };
    }
    const oldIds = existing?.chunkIds ?? [];
    if (oldIds.length) {
      await this.vector.delete(oldIds);
      await this.keyword.delete(oldIds);
      for (const id of oldIds) {
        this.chunks.delete(id);
      }
    }
    const embedder = getEmbedder(this.config);
    const vectors = [] as { id: string; vector: Float32Array }[];
    for (const chunk of indexed.chunks) {
      const vector = await embedder.embed(chunk.text);
      vectors.push({ id: chunk.id, vector });
      this.chunks.set(chunk.id, chunk);
    }
    if (vectors.length) {
      await this.vector.upsert(vectors);
      await this.keyword.upsert(
        vectors.map(({ id }) => {
          const chunk = this.chunks.get(id)!;
          return {
            id,
            text: chunk.text,
            ...(chunk.tags ? { tags: chunk.tags } : {})
          };
        })
      );
    }
    this.manifest.files[filePath] = {
      path: filePath,
      type: indexed.type,
      size: indexed.size,
      mtime: indexed.mtime,
      checksum,
      chunkIds,
      partial: indexed.partial
    };
    this.manifest.lastIndexedAt = now();
    this.recomputeCounts();
    await this.persist();
    return { skipped: false, chunkCount: indexed.chunks.length };
  }

  async removeFile(filePath: string): Promise<void> {
    const existing = this.manifest.files[filePath];
    if (!existing) return;
    await this.vector.delete(existing.chunkIds);
    await this.keyword.delete(existing.chunkIds);
    for (const id of existing.chunkIds) {
      this.chunks.delete(id);
    }
    delete this.manifest.files[filePath];
    this.recomputeCounts();
    this.manifest.lastIndexedAt = now();
    await this.persist();
  }

  getStats(): StoreStats {
    const avgChunkLen = this.chunks.size
      ? Math.round(
          Array.from(this.chunks.values()).reduce((sum, chunk) => sum + chunk.text.length, 0) /
            this.chunks.size
        )
      : 0;
    return {
      files: this.manifest.totalFiles,
      chunks: this.manifest.totalChunks,
      byType: this.manifest.byType,
      avgChunkLen,
      embeddingsCached: this.vector.size(),
      lastIndexedAt: this.manifest.lastIndexedAt
    };
  }

  getChunkById(id: string): Chunk | undefined {
    return this.chunks.get(id);
  }

  getChunksByPath(filePath: string, page?: number): Chunk[] {
    const chunks = Array.from(this.chunks.values()).filter((chunk) => chunk.path === filePath);
    const filtered = page ? chunks.filter((chunk) => chunk.page === page) : chunks;
    return filtered.sort((a, b) => (a.offsetStart ?? 0) - (b.offsetStart ?? 0));
  }

  async listCandidateFiles(paths: string[] = []): Promise<string[]> {
    const guard = await FSGuard.create(this.config.roots);
    const resolved: string[] = [];
    const targets = paths.length ? paths : this.config.roots.roots;
    for (const target of targets) {
      try {
        const stats = await fs.stat(target);
        if (stats.isDirectory()) {
          const entries = await fg("**/*", {
            cwd: target,
            dot: false,
            onlyFiles: true,
            followSymbolicLinks: false
          });
          for (const entry of entries) {
            const candidate = path.join(target, entry);
            resolved.push(candidate);
          }
        } else if (stats.isFile()) {
          resolved.push(target);
        }
      } catch (error) {
        debug("list-candidate-skip", { target, error: (error as Error).message });
      }
    }
    return guard.filterAllowed(resolved);
  }
}

export async function reindexPaths(store: Store, paths: string[]): Promise<{ indexed: number; updated: number; skipped: number }> {
  const guard = await FSGuard.create(store.getConfig().roots);
  const files = await store.listCandidateFiles(paths);
  let indexed = 0;
  let updated = 0;
  let skipped = 0;
  for (const file of files) {
    try {
      const resolved = await guard.resolvePath(file);
      const relative = path.relative(process.cwd(), resolved);
      const indexedFile = await indexFile(relative, store.getConfig());
      const result = await store.upsertFile(relative, indexedFile);
      if (result.skipped) {
        skipped += 1;
      } else {
        indexed += indexedFile.chunks.length;
        updated += 1;
      }
    } catch (error) {
      info("reindex-error", { path: file, error: (error as Error).message });
    }
  }
  return { indexed, updated, skipped };
}
