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

export interface FileIndexRecord {
  path: string;
  type: ChunkKind;
  chunkIds: string[];
  mtime: number;
  size: number;
  partial?: boolean;
}

export interface Manifest {
  files: Record<string, FileIndexRecord>;
  chunks: number;
  byType: Record<ChunkKind, number>;
  embeddingsCached: number;
  lastIndexedAt?: number;
}
