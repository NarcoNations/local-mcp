import type { z } from "zod";

export type ChunkType = "pdf" | "markdown" | "text" | "word" | "pages";

export interface Chunk {
  id: string;
  path: string;
  type: ChunkType;
  page?: number;
  offsetStart?: number;
  offsetEnd?: number;
  text: string;
  tokens?: number;
  tags?: string[];
  partial?: boolean;
  mtime: number;
}

export interface Citation {
  filePath: string;
  page?: number;
  startChar?: number;
  endChar?: number;
  snippet: string;
}

export interface SearchHit {
  chunkId: string;
  score: number;
  text: string;
  citation: Citation;
}

export interface HybridSearchOptions {
  query: string;
  k: number;
  alpha: number;
  filters?: {
    type?: ChunkType[];
  };
}

export interface RootsConfig {
  roots: string[];
  include: string[];
  exclude: string[];
}

export interface IndexConfig {
  chunkSize: number;
  chunkOverlap: number;
  ocrEnabled: boolean;
  ocrTriggerMinChars: number;
  useSQLiteVSS: boolean;
  model: string;
  maxFileSizeMB?: number;
  concurrency?: number;
  languages?: string[];
}

export interface OutConfig {
  dataDir: string;
  modelCacheDir?: string;
}

export interface AppConfig {
  roots: RootsConfig;
  index: IndexConfig;
  out: OutConfig;
}

export interface ManifestEntry {
  path: string;
  type: ChunkType;
  mtime: number;
  size: number;
  chunkIds: string[];
  partial?: boolean;
  tags?: string[];
}

export interface Manifest {
  files: Record<string, ManifestEntry>;
  chunks: Record<string, Chunk>;
  stats: {
    files: number;
    chunks: number;
    byType: Record<ChunkType, number>;
    avgChunkLen: number;
    embeddingsCached: number;
    lastIndexedAt?: number;
  };
}

export interface ReindexSummary {
  indexed: number;
  updated: number;
  skipped: number;
}

export type ZodSchema<T> = z.ZodType<T>;
