import { promises as fs } from "fs";
import path from "path";
import fg from "fast-glob";
import chokidar from "chokidar";
import { AppConfig } from "../config.js";
import {
  Chunk,
  ChunkKind,
  DocumentResult,
  IndexFileResult,
  Manifest,
  ReindexSummary,
  SearchOptions,
  SearchResult,
  StoreStats,
} from "../types.js";
import { FlatVectorStore } from "./vector-flat.js";
import { KeywordStore } from "./keyword.js";
import { computeChunkHash } from "../pipeline/chunk.js";
import { embedText } from "../pipeline/embed.js";
import { buildCitation } from "../utils/cite.js";
import { logger } from "../utils/logger.js";
import { nowIso } from "../utils/time.js";
import { indexPdf } from "../indexers/pdf.js";
import { indexMarkdown } from "../indexers/markdown.js";
import { indexText } from "../indexers/text.js";
import { indexWord } from "../indexers/word.js";
import { indexPages } from "../indexers/pages.js";

interface DocumentCache {
  path: string;
  type: ChunkKind;
  fullText?: string;
  pages?: string[];
  partial?: boolean;
}

const MANIFEST_VERSION = 1;

function createEmptyManifest(): Manifest {
  const now = nowIso();
  return {
    version: MANIFEST_VERSION,
    createdAt: now,
    updatedAt: now,
    files: {},
    chunks: {},
  };
}

function normalizeRel(filePath: string): string {
  const abs = path.resolve(filePath);
  return path.relative(process.cwd(), abs);
}

function extname(filePath: string): string {
  return path.extname(filePath).toLowerCase();
}

function getFirstChunkType(chunks: Chunk[]): ChunkKind {
  if (chunks.length === 0) {
    return "text";
  }
  return chunks[0].type;
}

export class ResearchStore {
  private manifest: Manifest = createEmptyManifest();
  private vectorStore!: FlatVectorStore;
  private keywordStore = new KeywordStore();
  private readonly manifestPath: string;
  private readonly docDir: string;
  private initialized = false;

  constructor(private config: AppConfig) {
    const dataDir = path.resolve(process.cwd(), config.out.dataDir);
    this.manifestPath = path.join(dataDir, "manifest.json");
    this.docDir = path.join(dataDir, "docs");
  }

  async ready() {
    await this.ensureInitialized();
  }

  getRoots(): string[] {
    return [...this.config.roots.roots];
  }

  private async ensureInitialized() {
    if (this.initialized) return;
    await fs.mkdir(path.dirname(this.manifestPath), { recursive: true });
    await fs.mkdir(this.docDir, { recursive: true });
    await this.loadManifest();
    this.vectorStore = await FlatVectorStore.load(path.dirname(this.manifestPath));
    for (const chunk of Object.values(this.manifest.chunks)) {
      this.keywordStore.upsert({ id: chunk.id, text: chunk.text, tags: chunk.tags ?? [], type: chunk.type });
    }
    this.initialized = true;
  }

  private async loadManifest() {
    try {
      const raw = await fs.readFile(this.manifestPath, "utf8");
      const parsed = JSON.parse(raw) as Manifest;
      if (parsed.version === MANIFEST_VERSION) {
        this.manifest = parsed;
        return;
      }
    } catch {}
    this.manifest = createEmptyManifest();
    await this.persistManifest();
  }

  private async persistManifest() {
    this.manifest.updatedAt = nowIso();
    await fs.writeFile(this.manifestPath, JSON.stringify(this.manifest, null, 2), "utf8");
  }

  private shouldInclude(filePath: string): boolean {
    const ext = extname(filePath);
    return this.config.roots.include.includes(ext);
  }

  private pickIndexer(ext: string) {
    switch (ext) {
      case ".pdf":
        return (abs: string, mtime: number) => indexPdf(abs, mtime, this.chunkOptions(), this.config.index);
      case ".md":
      case ".markdown":
        return (abs: string, mtime: number) => indexMarkdown(abs, mtime, this.chunkOptions());
      case ".txt":
        return (abs: string, mtime: number) => indexText(abs, mtime, this.chunkOptions());
      case ".docx":
        return (abs: string, mtime: number) => indexWord(abs, mtime, this.chunkOptions());
      case ".pages":
        return (abs: string, mtime: number) => indexPages(abs, mtime, this.chunkOptions());
      default:
        return null;
    }
  }

  private chunkOptions() {
    return { chunkSize: this.config.index.chunkSize, chunkOverlap: this.config.index.chunkOverlap };
  }

  private async writeDocumentCache(entry: DocumentCache, docPath: string) {
    await fs.writeFile(docPath, JSON.stringify(entry), "utf8");
  }

  async reindex(paths?: string[]): Promise<ReindexSummary> {
    await this.ensureInitialized();
    const summary: ReindexSummary = { indexed: 0, updated: 0, skipped: 0, removed: 0 };
    const input = paths && paths.length > 0 ? paths : this.config.roots.roots;
    const files: string[] = [];
    for (const entry of input) {
      const absEntry = path.resolve(entry);
      try {
        const stat = await fs.stat(absEntry);
        if (stat.isDirectory()) {
          const pattern = path.join(absEntry, "**/*");
          const dirFiles = await fg(pattern, {
            onlyFiles: true,
            ignore: this.config.roots.exclude,
            dot: false,
          });
          files.push(...dirFiles);
        } else if (stat.isFile()) {
          files.push(absEntry);
        }
      } catch (err) {
        logger.warn("path-skipped", { entry, err: (err as Error).message });
      }
    }
    const seen = new Set<string>();

    for (const absFile of files) {
      const rel = normalizeRel(absFile);
      seen.add(rel);
      if (!this.shouldInclude(rel)) {
        summary.skipped += 1;
        continue;
      }
      const indexer = this.pickIndexer(extname(rel));
      if (!indexer) {
        summary.skipped += 1;
        continue;
      }
      const stat = await fs.stat(absFile);
      if (this.config.index.maxFileSizeMB) {
        const maxBytes = this.config.index.maxFileSizeMB * 1024 * 1024;
        if (stat.size > maxBytes) {
          logger.warn("file-skipped-too-large", { path: rel, size: stat.size });
          summary.skipped += 1;
          continue;
        }
      }
      const existing = this.manifest.files[rel];
      if (existing && existing.mtime === stat.mtimeMs && existing.size === stat.size) {
        summary.skipped += 1;
        continue;
      }

      let result: IndexFileResult;
      try {
        result = await indexer(absFile, stat.mtimeMs);
      } catch (err) {
        logger.error("indexing-failed", { path: rel, err: (err as Error).message });
        summary.skipped += 1;
        continue;
      }

      const chunkIds: string[] = [];
      for (const chunk of result.chunks) {
        chunk.path = rel;
        chunk.mtime = stat.mtimeMs;
        chunk.partial = Boolean(chunk.partial || result.partial);
        const hash = computeChunkHash(chunk);
        this.keywordStore.upsert({ id: chunk.id, text: chunk.text, tags: chunk.tags ?? [], type: chunk.type });
        const vector = await embedText(chunk.text, this.config.index.model);
        this.vectorStore.upsert(chunk.id, vector);
        this.manifest.chunks[chunk.id] = { ...chunk, hash };
        chunkIds.push(chunk.id);
      }

      if (existing) {
        if (existing.docPath) {
          const prevDoc = path.join(this.docDir, existing.docPath);
          if (result.fileHash && existing.docPath !== `${result.fileHash}.json`) {
            try {
              await fs.unlink(prevDoc);
            } catch {}
          }
        }
        for (const id of existing.chunkIds) {
          if (!chunkIds.includes(id)) {
            delete this.manifest.chunks[id];
            this.keywordStore.remove(id);
            this.vectorStore.delete(id);
          }
        }
        summary.updated += 1;
      } else {
        summary.indexed += 1;
      }

      const fileHash = result.fileHash ?? `${Buffer.from(rel).toString("base64url")}-${stat.mtimeMs}`;
      const docFilename = `${fileHash}.json`;
      const docPath = path.join(this.docDir, docFilename);
      await this.writeDocumentCache({
        path: rel,
        type: getFirstChunkType(result.chunks),
        fullText: result.fullText,
        pages: result.pages,
        partial: result.partial,
      }, docPath);

      this.manifest.files[rel] = {
        path: rel,
        type: getFirstChunkType(result.chunks),
        size: stat.size,
        mtime: stat.mtimeMs,
        hash: fileHash,
        chunkIds,
        partial: result.partial,
        pages: result.pages?.length,
        docPath: docFilename,
      };
    }

    if (!paths || paths.length === 0) {
      for (const existing of Object.keys(this.manifest.files)) {
        if (!seen.has(existing)) {
          await this.removeFile(existing);
          summary.removed += 1;
        }
      }
    }

    await this.vectorStore.persist();
    await this.persistManifest();
    return summary;
  }

  private async removeFile(rel: string) {
    const entry = this.manifest.files[rel];
    if (!entry) return;
    for (const id of entry.chunkIds) {
      delete this.manifest.chunks[id];
      this.keywordStore.remove(id);
      this.vectorStore.delete(id);
    }
    if (entry.docPath) {
      const docPath = path.join(this.docDir, entry.docPath);
      try {
        await fs.unlink(docPath);
      } catch {}
    }
    delete this.manifest.files[rel];
  }

  async search(query: string, options: SearchOptions): Promise<SearchResult[]> {
    await this.ensureInitialized();
    const alpha = Math.min(Math.max(options.alpha, 0), 1);
    const denseLimit = Math.max(options.k * 4, 32);
    const vector = await embedText(query, this.config.index.model);
    const dense = this.vectorStore.search(vector, denseLimit);
    const keyword = this.keywordStore.search(query, denseLimit, options.filters?.type);
    const combined = new Map<string, number>();
    const typeFilter = options.filters?.type;

    for (const hit of dense) {
      const chunk = this.manifest.chunks[hit.id];
      if (!chunk) continue;
      if (typeFilter && !typeFilter.includes(chunk.type)) continue;
      const normalized = (hit.score + 1) / 2;
      combined.set(hit.id, (combined.get(hit.id) ?? 0) + alpha * normalized);
    }

    keyword.forEach((hit) => {
      const chunk = this.manifest.chunks[hit.id];
      if (!chunk) return;
      const keywordScore = 1 / (1 + hit.rank);
      combined.set(hit.id, (combined.get(hit.id) ?? 0) + (1 - alpha) * keywordScore);
    });

    const ranked = Array.from(combined.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, options.k);

    return ranked
      .map(([id, score]) => {
        const chunk = this.manifest.chunks[id];
        if (!chunk) return null;
        const text = chunk.text.length > 600 ? `${chunk.text.slice(0, 600)}…` : chunk.text;
        return {
          chunkId: id,
          score,
          text,
          citation: buildCitation(chunk),
        };
      })
      .filter((value): value is SearchResult => value !== null);
  }

  async getDocument(targetPath: string, page?: number): Promise<DocumentResult> {
    await this.ensureInitialized();
    const rel = normalizeRel(targetPath);
    const entry = this.manifest.files[rel];
    if (!entry) {
      throw new Error(`Path not indexed: ${targetPath}`);
    }
    const docPath = entry.docPath ? path.join(this.docDir, entry.docPath) : null;
    let cache: DocumentCache | null = null;
    if (docPath) {
      try {
        const raw = await fs.readFile(docPath, "utf8");
        cache = JSON.parse(raw) as DocumentCache;
      } catch {}
    }
    if (page != null && cache?.pages) {
      const text = cache.pages[page - 1] ?? "";
      return { path: rel, page, text, partial: cache.partial, type: entry.type };
    }
    const text = cache?.fullText ?? cache?.pages?.join("\n\n") ?? "";
    return { path: rel, text, partial: cache?.partial, type: entry.type };
  }

  async stats(): Promise<StoreStats> {
    await this.ensureInitialized();
    const byType: StoreStats["byType"] = {
      pdf: 0,
      markdown: 0,
      text: 0,
      word: 0,
      pages: 0,
    } as any;
    let totalLen = 0;
    let chunks = 0;
    for (const chunk of Object.values(this.manifest.chunks)) {
      byType[chunk.type] = (byType[chunk.type] ?? 0) + 1;
      totalLen += chunk.text.length;
      chunks += 1;
    }
    const avgChunkLen = chunks === 0 ? 0 : Math.round(totalLen / chunks);
    return {
      files: Object.keys(this.manifest.files).length,
      chunks,
      byType,
      avgChunkLen,
      embeddingsCached: this.vectorStore.size(),
      lastIndexedAt: this.manifest.updatedAt,
    };
  }

  async watch(paths: string[], handler: (event: { event: string; path: string }) => void) {
    await this.ensureInitialized();
    const watcher = chokidar.watch(paths.length ? paths : this.config.roots.roots, {
      ignoreInitial: true,
      ignored: this.config.roots.exclude,
    });

    await new Promise<void>((resolve) => {
      watcher.once("ready", () => resolve());
    });

    const queue: Promise<unknown>[] = [];
    const enqueue = (promise: Promise<unknown>) => {
      queue.push(promise.finally(() => {
        const index = queue.indexOf(promise);
        if (index >= 0) queue.splice(index, 1);
      }));
    };

    watcher.on("add", (filePath) => {
      handler({ event: "add", path: normalizeRel(filePath) });
      enqueue(this.reindex([filePath]));
    });
    watcher.on("change", (filePath) => {
      handler({ event: "change", path: normalizeRel(filePath) });
      enqueue(this.reindex([filePath]));
    });
    watcher.on("unlink", (filePath) => {
      handler({ event: "unlink", path: normalizeRel(filePath) });
      enqueue(
        (async () => {
          await this.ensureInitialized();
          await this.removeFile(normalizeRel(filePath));
          await this.vectorStore.persist();
          await this.persistManifest();
        })(),
      );
    });

    return async () => {
      await watcher.close();
      await Promise.allSettled(queue);
    };
  }
}

export async function createStore(config: AppConfig): Promise<ResearchStore> {
  const store = new ResearchStore(config);
  await store.ready();
  return store;
}
