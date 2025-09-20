import { promises as fs } from "fs";
import type { Stats } from "node:fs";
import path from "path";
import { loadConfig } from "../config.js";
import { runIndexer } from "../indexers/index.js";
import type { AppConfig, Chunk, HybridSearchOptions, Manifest, ManifestEntry, ReindexSummary, SearchHit } from "../types.js";
import { buildCitation } from "../utils/cite.js";
import { ensureDir, assertWithinRoots, collectFiles, pathStats } from "../utils/fs-guard.js";
import { createLogger } from "../utils/logger.js";
import { now } from "../utils/time.js";
import { getEmbeddingService } from "../pipeline/embed.js";
import { FlatVectorIndex } from "./vector-flat.js";
import { KeywordIndex } from "./keyword.js";

const logger = createLogger("store");

const EMPTY_MANIFEST: Manifest = {
  files: {},
  chunks: {},
  stats: {
    files: 0,
    chunks: 0,
    byType: {
      pdf: 0,
      markdown: 0,
      text: 0,
      word: 0,
      pages: 0,
    },
    avgChunkLen: 0,
    embeddingsCached: 0,
  },
};

class Store {
  private manifest: Manifest = EMPTY_MANIFEST;
  private config!: AppConfig;
  private dataDir!: string;
  private manifestPath!: string;
  private vectorIndex!: FlatVectorIndex;
  private keywordIndex!: KeywordIndex;
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    this.config = await loadConfig();
    this.dataDir = this.config.out.dataDir;
    this.manifestPath = path.join(this.dataDir, "manifest.json");
    await ensureDir(this.dataDir);

    try {
      const raw = await fs.readFile(this.manifestPath, "utf8");
      this.manifest = JSON.parse(raw) as Manifest;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        logger.warn("manifest_load_failed", { error: String(err) });
      }
      this.manifest = JSON.parse(JSON.stringify(EMPTY_MANIFEST));
    }

    this.vectorIndex = new FlatVectorIndex(this.dataDir);
    await this.vectorIndex.load();

    this.keywordIndex = new KeywordIndex(this.dataDir);
    await this.keywordIndex.load();

    // Rehydrate keyword index from manifest if needed
    if (this.keywordIndex.count() === 0) {
      Object.values(this.manifest.chunks).forEach(chunk => this.keywordIndex.add(chunk));
    }

    this.initialized = true;
  }

  private async persist(): Promise<void> {
    await fs.writeFile(this.manifestPath, JSON.stringify(this.manifest, null, 2), "utf8");
    await this.vectorIndex.persist();
    await this.keywordIndex.persist();
  }

  private updateStats(): void {
    const chunks = Object.values(this.manifest.chunks);
    const byType = { pdf: 0, markdown: 0, text: 0, word: 0, pages: 0 } as Manifest["stats"]["byType"];
    let totalLength = 0;
    chunks.forEach(chunk => {
      byType[chunk.type] = (byType[chunk.type] ?? 0) + 1;
      totalLength += chunk.text.length;
    });
    this.manifest.stats = {
      files: Object.keys(this.manifest.files).length,
      chunks: chunks.length,
      byType,
      avgChunkLen: chunks.length ? totalLength / chunks.length : 0,
      embeddingsCached: this.vectorIndex.size(),
      lastIndexedAt: now(),
    };
  }

  private async indexFile(filePath: string, stats: Stats): Promise<Chunk[]> {
    const tags: string[] | undefined = undefined;
    const chunks = await runIndexer({
      filePath,
      mtime: stats.mtimeMs,
      config: this.config,
      tags,
    });
    return chunks;
  }

  private async upsertFile(filePath: string, stats: Stats): Promise<void> {
    const existing = this.manifest.files[filePath];
    if (existing) {
      this.vectorIndex.removeVectors(existing.chunkIds);
      existing.chunkIds.forEach(id => {
        delete this.manifest.chunks[id];
        this.keywordIndex.remove(id);
      });
    }

    const chunks = await this.indexFile(filePath, stats);
    const chunkIds = chunks.map(chunk => chunk.id);

    const embedder = getEmbeddingService(this.config);
    for (const chunk of chunks) {
      this.manifest.chunks[chunk.id] = chunk;
      this.keywordIndex.add(chunk);
      const vector = await embedder.embed(chunk.text);
      this.vectorIndex.setVector(chunk.id, vector);
    }

    const entry: ManifestEntry = {
      path: filePath,
      type: chunks[0]?.type ?? "text",
      mtime: stats.mtimeMs,
      size: stats.size,
      chunkIds,
      partial: chunks.some(chunk => chunk.partial),
    };
    this.manifest.files[filePath] = entry;
  }

  private async removeFile(filePath: string): Promise<void> {
    const existing = this.manifest.files[filePath];
    if (!existing) return;
    this.vectorIndex.removeVectors(existing.chunkIds);
    existing.chunkIds.forEach(id => {
      delete this.manifest.chunks[id];
      this.keywordIndex.remove(id);
    });
    delete this.manifest.files[filePath];
  }

  async reindex(paths?: string[]): Promise<ReindexSummary> {
    await this.init();
    const targets = await collectFiles(paths ?? [], this.config.roots);
    let indexed = 0;
    let updated = 0;
    let skipped = 0;

    for (const file of targets) {
      const resolved = assertWithinRoots(file, this.config.roots.roots);
      const stats = await pathStats(resolved);
      if (!stats) continue;
      if (this.config.index.maxFileSizeMB && stats.size > this.config.index.maxFileSizeMB * 1024 * 1024) {
        logger.warn("file_too_large", { file: resolved, size: stats.size });
        skipped++;
        continue;
      }
      const existing = this.manifest.files[resolved];
      if (existing && existing.mtime === stats.mtimeMs && existing.size === stats.size) {
        skipped++;
        continue;
      }
      await this.upsertFile(resolved, stats);
      if (existing) updated++;
      else indexed++;
    }

    this.updateStats();
    await this.persist();

    return { indexed, updated, skipped };
  }

  async removeMissingFiles(): Promise<void> {
    await this.init();
    const files = Object.keys(this.manifest.files);
    for (const file of files) {
      const stats = await pathStats(file);
      if (!stats) {
        await this.removeFile(file);
      }
    }
    this.updateStats();
    await this.persist();
  }

  async hybridSearch(options: HybridSearchOptions): Promise<SearchHit[]> {
    await this.init();
    const embedder = getEmbeddingService(this.config);
    const queryVector = await embedder.embed(options.query);
    const denseHits = this.vectorIndex.search(queryVector, Math.max(options.k * 4, 64));
    const keywordHits = this.keywordIndex.search(options.query, Math.max(options.k * 4, 64));

    const scores = new Map<string, { dense: number; keyword: number }>();
    for (const hit of denseHits) {
      scores.set(hit.chunkId, { dense: hit.score, keyword: 0 });
    }
    for (const hit of keywordHits) {
      const existing = scores.get(hit.chunkId) ?? { dense: 0, keyword: 0 };
      existing.keyword = Math.max(existing.keyword, hit.score);
      scores.set(hit.chunkId, existing);
    }

    const chunks = this.manifest.chunks;
    const filtered = Array.from(scores.entries())
      .map(([chunkId, score]) => {
        const chunk = chunks[chunkId];
        if (!chunk) return undefined;
        if (options.filters?.type && !options.filters.type.includes(chunk.type)) return undefined;
        const combined = options.alpha * score.dense + (1 - options.alpha) * score.keyword;
        return { chunk, score: combined };
      })
      .filter((value): value is { chunk: Chunk; score: number } => Boolean(value));

    filtered.sort((a, b) => b.score - a.score);
    return filtered.slice(0, options.k).map(({ chunk, score }) => ({
      chunkId: chunk.id,
      score,
      text: chunk.text.slice(0, 600),
      citation: buildCitation(chunk),
    }));
  }

  async getDocument(pathInput: string, page?: number): Promise<{ path: string; page?: number; text: string }> {
    await this.init();
    const pathResolved = assertWithinRoots(pathInput, this.config.roots.roots);
    const chunks = Object.values(this.manifest.chunks).filter(chunk => chunk.path === pathResolved);
    if (chunks.length === 0) {
      throw new Error(`File ${pathResolved} is not indexed.`);
    }
    let text = "";
    if (page) {
      text = chunks
        .filter(chunk => chunk.page === page)
        .map(chunk => chunk.text)
        .join("\n\n");
    } else {
      text = chunks
        .sort((a, b) => (a.offsetStart ?? 0) - (b.offsetStart ?? 0))
        .map(chunk => chunk.text)
        .join("\n\n");
    }
    return { path: pathResolved, page, text };
  }

  getStats(): Manifest["stats"] {
    return this.manifest.stats;
  }
}

let storeInstance: Store | undefined;

function getStoreInstance(): Store {
  if (!storeInstance) {
    storeInstance = new Store();
  }
  return storeInstance;
}

export async function reindexPaths(paths?: string[]): Promise<ReindexSummary> {
  return getStoreInstance().reindex(paths);
}

export async function searchHybrid(options: HybridSearchOptions): Promise<SearchHit[]> {
  return getStoreInstance().hybridSearch(options);
}

export async function getDocument(path: string, page?: number) {
  return getStoreInstance().getDocument(path, page);
}

export async function getStats() {
  return getStoreInstance().getStats();
}

export async function ensureInitialized() {
  await getStoreInstance().init();
}
