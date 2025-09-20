import { Chunk } from "../types.js";

export interface FileManifestEntry {
  path: string;
  type: string;
  chunkIds: string[];
  mtime: number;
  hash: string;
  partial?: boolean;
}

export interface ManifestData {
  version: number;
  files: Record<string, FileManifestEntry>;
  chunks: Record<string, Chunk>;
  stats: {
    updatedAt: number | null;
  };
}

export const CURRENT_MANIFEST_VERSION = 1;
