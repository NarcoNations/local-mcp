import type { AppConfig, Chunk } from "../types.js";

export interface IndexerArgs {
  filePath: string;
  mtime: number;
  config: AppConfig;
  tags?: string[];
}

export type IndexerFn = (args: IndexerArgs) => Promise<Chunk[]>;
