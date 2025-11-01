import { promises as fs } from "fs";
import path from "path";
import { AppConfig } from "../config.js";
import { Chunk, Manifest } from "../types.js";
import { logger } from "../utils/logger.js";
import { discoverFiles, ensureWithinRoots } from "../utils/fs-guard.js";
import { chunkCacheKey } from "../utils/hash.js";
import { embedText } from "../pipeline/embed.js";
import { FlatVectorIndex } from "./vector-flat.js";
import { KeywordIndex } from "./keyword.js";
import { indexPdf } from "../indexers/pdf.js";
import { indexMarkdown } from "../indexers/markdown.js";
import { indexText } from "../indexers/text.js";
import { indexWord } from "../indexers/word.js";
import { indexPages } from "../indexers/pages.js";
import { SupabaseSync } from "./storage-supabase.js";

export interface ReindexStats {
  indexed: number;
  updated: number;
  skipped: number;
}

const CHUNKS_FILE = "chunks.json";
const MANIFEST_FILE = "manifest.json";

function defaultManifest(): Manifest {
  return {
    files: {},
    chunks: 0,
    byType: { pdf: 0, markdown: 0, text: 0, word: 0, pages: 0 },
    embeddingsCached: 0,
  } as Manifest;
}

function cloneManifest(manifest: Manifest): Manifest {
  return JSON.parse(JSON.stringify(manifest));
}

export class KnowledgeStore {
  private chunkPath: string;
  private manifestPath: string;
  private manifest: Manifest = defaultManifest();
  private chunks = new Map<string, Chunk>();
  private fileToChunks = new Map<string, string[]>();
  private vectorIndex: FlatVectorIndex;
  private keywordIndex = new KeywordIndex();
  private supabaseSync: SupabaseSync;

  constructor(private config: AppConfig) {
    const dataDir = path.resolve(process.cwd(), config.out.dataDir);
    this.chunkPath = path.join(dataDir, CHUNKS_FILE);
    this.manifestPath = path.join(dataDir, MANIFEST_FILE);
    this.vectorIndex = new FlatVectorIndex(dataDir);
    this.supabaseSync = new SupabaseSync();
  }

  async load(): Promise<void> {
    await fs.mkdir(path.dirname(this.chunkPath), { recursive: true });
    try {
      const raw = await fs.readFile(this.chunkPath, "utf8");
      const stored = JSON.parse(raw) as Chunk[];
      stored.forEach((chunk) => {
        this.chunks.set(chunk.id, chunk);
        const list = this.fileToChunks.get(chunk.path) ?? [];
        list.push(chunk.id);
        this.fileToChunks.set(chunk.path, list);
      });
    } catch (err: any) {
      if (err?.code !== "ENOENT") {
        logger.error("chunk-store-load-failed", { err: String(err) });
      }
    }

    try {
      const rawManifest = await fs.readFile(this.manifestPath, "utf8");
      this.manifest = JSON.parse(rawManifest) as Manifest;
    } catch (err: any) {
      if (err?.code === "ENOENT") {
        this.manifest = defaultManifest();
      } else {
        logger.error("manifest-load-failed", { err: String(err) });
      }
    }

    await this.vectorIndex.load();
    this.keywordIndex.rebuild(Array.from(this.chunks.values()));
    if (this.vectorIndex.size === 0 && this.chunks.size > 0) {
      await this.rebuildVectorIndex();
    }
  }

  private async rebuildVectorIndex(): Promise<void> {
    const embeddings = new Map<string, Float32Array>();
    for (const [id, chunk] of this.chunks.entries()) {
      const cacheKey = chunkCacheKey(chunk.path, chunk.mtime, chunk.offsetStart, chunk.offsetEnd);
      const vector = await embedText(chunk.text, cacheKey, {
        model: this.config.index.model,
        dataDir: path.resolve(process.cwd(), this.config.out.dataDir),
        modelCacheDir: this.config.out.modelCacheDir,
      });
      embeddings.set(id, vector);
    }
    await this.vectorIndex.rebuild(embeddings);
    this.manifest.embeddingsCached = embeddings.size;
    await this.persistManifest();
  }

  async reindex(targets: string[]): Promise<ReindexStats> {
    const stats: ReindexStats = { indexed: 0, updated: 0, skipped: 0 };
    const files = await this.collectFiles(targets);

    const embeddings = new Map<string, Float32Array>();
    for (const [id, vector] of this.vectorIndex.entries()) {
      embeddings.set(id, vector);
    }

    for (const file of files) {
      const stat = await fs.stat(file);
      const ext = path.extname(file).toLowerCase();
      if (this.config.index.maxFileSizeMB && stat.size / (1024 * 1024) > this.config.index.maxFileSizeMB) {
        logger.warn("file-too-large", { path: file, size: stat.size });
        stats.skipped++;
        continue;
      }
      const manifestEntry = this.manifest.files[file];
      if (manifestEntry && manifestEntry.mtime === stat.mtimeMs && manifestEntry.size === stat.size) {
        stats.skipped++;
        continue;
      }

      const chunks = await this.runIndexer(file, stat.mtimeMs, ext);
      if (!chunks) {
        stats.skipped++;
        continue;
      }

      const previous = this.fileToChunks.get(file) ?? [];
      previous.forEach((id) => {
        this.chunks.delete(id);
        embeddings.delete(id);
      });

      this.fileToChunks.set(file, chunks.map((chunk) => chunk.id));
      chunks.forEach((chunk) => this.chunks.set(chunk.id, chunk));

      for (const chunk of chunks) {
        const cacheKey = chunkCacheKey(chunk.path, chunk.mtime, chunk.offsetStart, chunk.offsetEnd);
        const vector = await embedText(chunk.text, cacheKey, {
          model: this.config.index.model,
          dataDir: path.resolve(process.cwd(), this.config.out.dataDir),
          modelCacheDir: this.config.out.modelCacheDir,
        });
        embeddings.set(chunk.id, vector);
      }

      const partial = chunks.length === 0 || chunks.some((chunk) => chunk.partial);
      this.manifest.files[file] = {
        path: file,
        type: chunks[0]?.type ?? "text",
        chunkIds: chunks.map((chunk) => chunk.id),
        mtime: stat.mtimeMs,
        size: stat.size,
        partial,
      };
      stats.indexed += chunks.length;
      stats.updated++;
    }

    this.keywordIndex.rebuild(Array.from(this.chunks.values()));
    await this.vectorIndex.rebuild(embeddings);
    this.manifest.embeddingsCached = embeddings.size;
    this.manifest.chunks = this.chunks.size;
    this.manifest.byType = { pdf: 0, markdown: 0, text: 0, word: 0, pages: 0 } as Manifest["byType"];
    for (const chunk of this.chunks.values()) {
      this.manifest.byType[chunk.type]++;
    }
    this.manifest.lastIndexedAt = Date.now();

    await this.persistChunks();
    await this.persistManifest();

    if (this.supabaseSync.enabled) {
      await this.supabaseSync.sync(this.manifest, this.chunks, embeddings);
    }

    return stats;
  }

  private async runIndexer(file: string, mtime: number, ext: string): Promise<Chunk[] | null> {
    if (ext === ".pdf") return indexPdf(file, mtime, this.config.index);
    if (ext === ".md" || ext === ".markdown") return indexMarkdown(file, mtime, this.config.index);
    if (ext === ".txt") return indexText(file, mtime, this.config.index);
    if (ext === ".docx") return indexWord(file, mtime, this.config.index);
    if (ext === ".pages") return indexPages(file, mtime, this.config.index);
    return null;
  }

  private async persistChunks(): Promise<void> {
    await fs.writeFile(this.chunkPath, JSON.stringify(Array.from(this.chunks.values()), null, 2), "utf8");
  }

  private async persistManifest(): Promise<void> {
    await fs.writeFile(this.manifestPath, JSON.stringify(cloneManifest(this.manifest), null, 2), "utf8");
  }

  private async collectFiles(targets: string[]): Promise<string[]> {
    if (targets.length === 0) {
      return discoverFiles(this.config.roots.roots, this.config.roots.include, this.config.roots.exclude);
    }
    const files: string[] = [];
    for (const target of targets) {
      try {
        const resolved = await ensureWithinRoots(this.config.roots.roots, target);
        const stat = await fs.stat(resolved);
        if (stat.isDirectory()) {
          const dirFiles = await discoverFiles([resolved], this.config.roots.include, this.config.roots.exclude);
          files.push(...dirFiles);
        } else if (stat.isFile()) {
          if (this.config.roots.include.includes(path.extname(resolved).toLowerCase())) {
            files.push(resolved);
          }
        }
      } catch (err) {
        logger.warn("collect-files-skip", { target, err: String(err) });
      }
    }
    return Array.from(new Set(files));
  }

  searchDense(queryVector: Float32Array, topK: number): { chunk: Chunk; score: number }[] {
    const hits = this.vectorIndex.search(queryVector, topK * 2);
    return hits
      .map((hit) => {
        const chunk = this.chunks.get(hit.id);
        if (!chunk) return null;
        return { chunk, score: hit.score };
      })
      .filter((val): val is { chunk: Chunk; score: number } => Boolean(val))
      .slice(0, topK);
  }

  searchKeyword(query: string, topK: number): { chunk: Chunk; score: number }[] {
    const hits = this.keywordIndex.search(query, topK * 2);
    return hits
      .map((hit) => {
        const chunk = this.chunks.get(hit.id);
        if (!chunk) return null;
        return { chunk, score: hit.score };
      })
      .filter((val): val is { chunk: Chunk; score: number } => Boolean(val))
      .slice(0, topK);
  }

  getChunk(id: string): Chunk | undefined {
    return this.chunks.get(id);
  }

  getManifest(): Manifest {
    return cloneManifest(this.manifest);
  }

  listChunks(): Chunk[] {
    return Array.from(this.chunks.values());
  }
}

let globalStore: KnowledgeStore | null = null;

export async function getStore(config: AppConfig): Promise<KnowledgeStore> {
  if (!globalStore) {
    globalStore = new KnowledgeStore(config);
    await globalStore.load();
  }
  return globalStore;
}
