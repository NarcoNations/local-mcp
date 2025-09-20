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

export interface UpsertResult {
  inserted: number;
  updated: number;
  deleted: number;
}

export interface FileManifestEntry {
  path: string;
  type: ChunkType;
  size: number;
  mtime: number;
  checksum: string;
  chunkIds: string[];
  partial?: boolean;
}

export interface Manifest {
  version: number;
  files: Record<string, FileManifestEntry>;
  byType: Record<ChunkType, number>;
  totalChunks: number;
  totalFiles: number;
  lastIndexedAt?: number;
}

export interface StoreStats {
  files: number;
  chunks: number;
  byType: Record<ChunkType, number>;
  avgChunkLen: number;
  embeddingsCached: number;
  lastIndexedAt?: number;
}
