import { AppConfig, Chunk } from "../types.js";

export interface IndexContext {
  absolutePath: string;
  relativePath: string;
  config: AppConfig;
  mtime: number;
}

export interface IndexResult {
  chunks: Chunk[];
  warnings: string[];
  partial?: boolean;
}

export type Indexer = (context: IndexContext) => Promise<IndexResult>;
