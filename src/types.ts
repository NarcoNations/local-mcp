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
