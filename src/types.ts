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
  chunk: Chunk;
}

export interface SearchFilters {
  type?: ChunkType[];
  tags?: string[];
}

export interface HybridSearchOptions {
  query: string;
  k: number;
  alpha: number;
  filters?: SearchFilters;
}

export interface SearchResponse {
  query: string;
  results: SearchHit[];
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

export interface FileManifestEntry {
  path: string;
  chunks: string[];
  mtime: number;
  hash: string;
  type: ChunkType;
  partial?: boolean;
}

export interface Manifest {
  files: Record<string, FileManifestEntry>;
  chunks: number;
  createdAt: number;
  updatedAt: number;
}

export interface StoreStats {
  files: number;
  chunks: number;
  byType: Record<ChunkType, number>;
  avgChunkLen: number;
  embeddingsCached: number;
  lastIndexedAt?: number;
}

export interface WatchEvent {
  event: "add" | "change" | "unlink";
  path: string;
}
