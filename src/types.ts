export type ChunkKind = "pdf" | "markdown" | "text" | "word" | "pages";

export interface Chunk {
  id: string;
  path: string;
  type: ChunkKind;
  page?: number;
  offsetStart?: number;
  offsetEnd?: number;
  text: string;
  tokens?: number;
  tags?: string[];
  partial?: boolean;
  mtime: number;
}

export interface ChunkWithEmbedding extends Chunk {
  vector?: Float32Array;
  hash: string;
}

export interface Citation {
  filePath: string;
  page?: number;
  startChar?: number;
  endChar?: number;
  snippet: string;
}

export interface SearchResult {
  chunkId: string;
  score: number;
  text: string;
  citation: Citation;
}

export interface FileManifestEntry {
  path: string;
  type: ChunkKind;
  size: number;
  mtime: number;
  hash: string;
  chunkIds: string[];
  partial?: boolean;
  pages?: number;
  docPath?: string;
}

export interface StoredChunk extends Chunk {
  hash: string;
}

export interface Manifest {
  version: number;
  createdAt: string;
  updatedAt: string;
  files: Record<string, FileManifestEntry>;
  chunks: Record<string, StoredChunk>;
}

export interface SearchOptions {
  k: number;
  alpha: number;
  filters?: {
    type?: ChunkKind[];
  };
}

export interface ReindexSummary {
  indexed: number;
  updated: number;
  skipped: number;
  removed: number;
}

export interface StoreStats {
  files: number;
  chunks: number;
  byType: Record<ChunkKind, number>;
  avgChunkLen: number;
  embeddingsCached: number;
  lastIndexedAt?: string;
}

export interface DocumentResult {
  path: string;
  page?: number;
  text: string;
  partial?: boolean;
  type: ChunkKind;
}

export interface IndexFileResult {
  chunks: Chunk[];
  pages?: string[];
  fullText?: string;
  partial?: boolean;
  tags?: string[];
  fileHash?: string;
}
