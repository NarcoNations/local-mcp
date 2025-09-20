import { promises as fs } from "node:fs";
import path from "node:path";
import fg from "fast-glob";
import type { AppConfig, Chunk, Manifest, SearchHit, SearchResponse, HybridSearchOptions } from "../types.js";
import { ManifestSchema } from "./schema.js";
import { FlatVectorIndex } from "./vector-flat.js";
import { KeywordIndex } from "./keyword.js";
import { createEmbeddingCache, embedText } from "../pipeline/embed.js";
import { indexPdf } from "../indexers/pdf.js";
import { indexMarkdown } from "../indexers/markdown.js";
import { indexText } from "../indexers/text.js";
import { indexWord } from "../indexers/word.js";
import { indexPages } from "../indexers/pages.js";
import { hashFile } from "../utils/hash.js";
import { buildSnippet } from "../utils/cite.js";
import type { SearchFilters, ChunkType, StoreStats } from "../types.js";

const EXTENSION_MAP: Record<string, ChunkType> = {
  ".pdf": "pdf",
  ".md": "markdown",
  ".markdown": "markdown",
  ".txt": "text",
  ".docx": "word",
  ".pages": "pages",
};

function getIndexer(type: ChunkType) {
  switch (type) {
    case "pdf":
      return indexPdf;
    case "markdown":
      return indexMarkdown;
    case "text":
      return indexText;
    case "word":
      return indexWord;
    case "pages":
      return indexPages;
    default:
      throw new Error(`Unsupported file type: ${type}`);
  }
}

function manifestDefaults(): Manifest {
  const now = Date.now();
  return { files: {}, chunks: 0, createdAt: now, updatedAt: now };
}

export class KnowledgeStore {
  private manifest: Manifest = manifestDefaults();
  private chunks = new Map<string, Chunk>();
  private vectorIndex: FlatVectorIndex;
  private keywordIndex: KeywordIndex;
  private embeddingCache;
  private manifestPath: string;
  private chunksPath: string;

  constructor(private config: AppConfig) {
    const baseDir = path.resolve(process.cwd(), config.out.dataDir);
    this.manifestPath = path.join(baseDir, "manifest.json");
    this.chunksPath = path.join(baseDir, "chunks.json");
    this.vectorIndex = new FlatVectorIndex(path.join(baseDir, "vectors.json"));
    this.keywordIndex = new KeywordIndex(path.join(baseDir, "keyword.json"));
    this.embeddingCache = createEmbeddingCache(path.join(baseDir, "embeddings"));
  }

  async init(): Promise<void> {
    await fs.mkdir(path.dirname(this.manifestPath), { recursive: true });
    await this.vectorIndex.load();
    await this.keywordIndex.load();
    await this.loadChunks();
    await this.loadManifest();
  }

  private async loadManifest(): Promise<void> {
    try {
      const raw = await fs.readFile(this.manifestPath, "utf8");
      const parsed = ManifestSchema.parse(JSON.parse(raw));
      this.manifest = parsed as Manifest;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
      this.manifest = manifestDefaults();
      await this.persistManifest();
    }
  }

  private async loadChunks(): Promise<void> {
    try {
      const raw = await fs.readFile(this.chunksPath, "utf8");
      const parsed = JSON.parse(raw) as Chunk[];
      for (const chunk of parsed) {
        this.chunks.set(chunk.id, chunk);
      }
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    }
  }

  private async persistManifest(): Promise<void> {
    this.manifest.updatedAt = Date.now();
    await fs.writeFile(this.manifestPath, JSON.stringify(this.manifest, null, 2));
  }

  private async persistChunks(): Promise<void> {
    await fs.writeFile(this.chunksPath, JSON.stringify(Array.from(this.chunks.values())));
  }

  private async persistIndexes(): Promise<void> {
    await this.vectorIndex.persist();
    await this.keywordIndex.persist();
  }

  private async chunkForFile(filePath: string, type: ChunkType): Promise<Chunk[]> {
    const indexer = getIndexer(type);
    return indexer(filePath, this.config);
  }

  private extensionForFile(filePath: string): ChunkType | undefined {
    const ext = path.extname(filePath).toLowerCase();
    return EXTENSION_MAP[ext];
  }

  private async ensureChunksForFile(filePath: string): Promise<{ chunks: Chunk[]; type: ChunkType; partial?: boolean }> {
    const type = this.extensionForFile(filePath);
    if (!type) throw new Error(`Unsupported file extension: ${filePath}`);
    const chunks = await this.chunkForFile(filePath, type);
    const partial = chunks.some((chunk) => chunk.partial);
    return { chunks, type, partial };
  }

  private async addChunks(filePath: string, chunks: Chunk[]): Promise<void> {
    for (const chunk of chunks) {
      this.chunks.set(chunk.id, chunk);
      const vector = await embedText(chunk.text, chunk.id, {
        model: this.config.index.model,
        cacheDir: this.config.out.modelCacheDir,
      }, this.embeddingCache);
      this.vectorIndex.upsert(chunk.id, vector);
      this.keywordIndex.upsert({ id: chunk.id, text: chunk.text, tags: chunk.tags });
    }
  }

  private removeChunks(chunkIds: string[]): void {
    for (const id of chunkIds) {
      this.chunks.delete(id);
      this.vectorIndex.remove(id);
      this.keywordIndex.remove(id);
    }
  }

  async indexPaths(paths: string[]): Promise<{ indexed: number; updated: number; skipped: number }> {
    const results = { indexed: 0, updated: 0, skipped: 0 };
    const roots = paths.length ? paths : this.config.roots.roots;
    const filesToIndex = new Set<string>();

    for (const root of roots) {
      const absolute = path.resolve(root);
      try {
        const stat = await fs.stat(absolute);
        if (stat.isFile()) {
          if (this.shouldIncludeFile(absolute)) {
            filesToIndex.add(absolute);
          }
          continue;
        }
      } catch {
        continue;
      }

      const patterns = this.config.roots.include.map((ext) => `${absolute.replace(/\\/g, "/")}/**/*${ext}`);
      const matches = await fg(patterns, {
        ignore: this.config.roots.exclude,
        absolute: true,
        suppressErrors: true,
      });
      matches.forEach((match) => filesToIndex.add(match));
    }

    for (const filePath of filesToIndex) {
      const stat = await fs.stat(filePath);
      const normalized = path.relative(process.cwd(), filePath).split(path.sep).join(path.posix.sep);
      const hash = await hashFile(await fs.readFile(filePath));
      const manifestEntry = this.manifest.files[normalized];

      if (manifestEntry && manifestEntry.hash === hash && manifestEntry.mtime === stat.mtimeMs) {
        results.skipped += 1;
        continue;
      }

      const previousChunks = manifestEntry?.chunks ?? [];
      if (previousChunks.length) this.removeChunks(previousChunks);

      const { chunks, type, partial } = await this.ensureChunksForFile(filePath);
      await this.addChunks(filePath, chunks);

      this.manifest.files[normalized] = {
        path: normalized,
        chunks: chunks.map((chunk) => chunk.id),
        mtime: stat.mtimeMs,
        hash,
        type,
        partial,
      };
      this.manifest.chunks = this.chunks.size;
      results.indexed += 1;
      if (manifestEntry) results.updated += 1;
    }

    await this.persistManifest();
    await this.persistChunks();
    await this.persistIndexes();
    return results;
  }

  private shouldIncludeFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return this.config.roots.include.some((includeExt) => includeExt.toLowerCase() === ext);
  }

  async removePath(filePath: string): Promise<void> {
    const normalized = path.relative(process.cwd(), path.resolve(filePath)).split(path.sep).join(path.posix.sep);
    const entry = this.manifest.files[normalized];
    if (!entry) return;
    this.removeChunks(entry.chunks);
    delete this.manifest.files[normalized];
    this.manifest.chunks = this.chunks.size;
    await this.persistManifest();
    await this.persistChunks();
    await this.persistIndexes();
  }

  private filterChunks(filters?: SearchFilters): Chunk[] {
    let chunkList = Array.from(this.chunks.values());
    if (!filters) return chunkList;
    if (filters.type?.length) {
      const allowed = new Set(filters.type);
      chunkList = chunkList.filter((chunk) => allowed.has(chunk.type));
    }
    if (filters.tags?.length) {
      chunkList = chunkList.filter((chunk) => {
        if (!chunk.tags) return false;
        return filters.tags!.every((tag) => chunk.tags!.includes(tag));
      });
    }
    return chunkList;
  }

  private buildSearchHits(ids: string[], scores: Map<string, number>): SearchHit[] {
    const hits: SearchHit[] = [];
    for (const id of ids) {
      const chunk = this.chunks.get(id);
      if (!chunk) continue;
      hits.push({
        chunkId: id,
        score: scores.get(id) ?? 0,
        text: chunk.text.slice(0, 600),
        citation: {
          filePath: chunk.path,
          page: chunk.page,
          startChar: chunk.offsetStart,
          endChar: chunk.offsetEnd,
          snippet: buildSnippet(chunk.text, 0, Math.min(280, chunk.text.length)),
        },
        chunk,
      });
    }
    return hits;
  }

  async search(options: HybridSearchOptions): Promise<SearchResponse> {
    const filteredChunks = this.filterChunks(options.filters);
    const filteredIds = new Set(filteredChunks.map((chunk) => chunk.id));

    const embedding = await embedText(options.query, `__query__${options.query}`, {
      model: this.config.index.model,
      cacheDir: this.config.out.modelCacheDir,
    }, this.embeddingCache);

    const denseHits = this.vectorIndex.search(embedding, 64).filter((hit) => filteredIds.has(hit.id));
    const keywordHits = this.keywordIndex.search(options.query, 64, options.filters?.tags).filter((hit) =>
      filteredIds.has(hit.id)
    );

    const denseMap = new Map<string, number>();
    for (const hit of denseHits) {
      denseMap.set(hit.id, (hit.score + 1) / 2);
    }

    const keywordMap = new Map<string, number>();
    keywordHits.forEach((hit, index) => {
      const score = 1 - index / Math.max(keywordHits.length, 1);
      keywordMap.set(hit.id, score);
    });

    const combinedScores = new Map<string, number>();
    for (const id of new Set([...denseMap.keys(), ...keywordMap.keys()])) {
      const denseScore = denseMap.get(id) ?? 0;
      const keywordScore = keywordMap.get(id) ?? 0;
      const score = options.alpha * denseScore + (1 - options.alpha) * keywordScore;
      combinedScores.set(id, score);
    }

    const sorted = Array.from(combinedScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, options.k)
      .map(([id]) => id);

    const hits = this.buildSearchHits(sorted, combinedScores);
    return { query: options.query, results: hits };
  }

  async getDocument(pathRef: string, page?: number): Promise<{ path: string; page?: number; text: string }> {
    const normalized = pathRef;
    const chunkList = Array.from(this.chunks.values()).filter((chunk) => chunk.path === normalized);
    if (!chunkList.length) throw new Error(`Document not indexed: ${pathRef}`);

    let filtered = chunkList;
    if (page !== undefined) {
      filtered = chunkList.filter((chunk) => chunk.page === page);
    }
    filtered.sort((a, b) => (a.offsetStart ?? 0) - (b.offsetStart ?? 0));
    const text = filtered.map((chunk) => chunk.text).join("\n\n");
    return { path: normalized, page, text };
  }

  stats(): StoreStats {
    const byType: Record<ChunkType, number> = {
      pdf: 0,
      markdown: 0,
      text: 0,
      word: 0,
      pages: 0,
    };
    let totalLength = 0;
    for (const chunk of this.chunks.values()) {
      byType[chunk.type] += 1;
      totalLength += chunk.text.length;
    }
    const avgChunkLen = this.chunks.size ? totalLength / this.chunks.size : 0;
    return {
      files: Object.keys(this.manifest.files).length,
      chunks: this.chunks.size,
      byType,
      avgChunkLen,
      embeddingsCached: this.chunks.size,
      lastIndexedAt: this.manifest.updatedAt,
    };
  }
}
