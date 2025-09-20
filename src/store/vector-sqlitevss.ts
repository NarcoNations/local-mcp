import { logger } from "../utils/logger.js";

export interface VectorScore {
  id: string;
  score: number;
}

export interface SQLiteVectorStoreLike {
  upsert(id: string, vector: Float32Array): Promise<void>;
  delete(id: string): Promise<void>;
  search(query: Float32Array, k: number): Promise<VectorScore[]>;
  close(): Promise<void>;
}

export async function createSQLiteVectorStore(_baseDir: string): Promise<SQLiteVectorStoreLike | null> {
  try {
    await import("sqlite3");
  } catch (err) {
    logger.info("sqlite3-missing", { err: (err as Error).message });
    return null;
  }
  logger.warn("sqlite-vss-fallback", { reason: "extension-not-implemented" });
  return null;
}
