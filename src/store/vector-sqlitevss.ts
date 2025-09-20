import { logger } from "../utils/logger.js";

export interface SQLiteVectorIndex {
  search(query: Float32Array, topK: number): Promise<{ id: string; score: number }[]>;
  rebuild(vectors: Map<string, Float32Array>): Promise<void>;
  size(): Promise<number>;
}

export async function createSQLiteVSSIndex(): Promise<SQLiteVectorIndex | undefined> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const sqlite3 = require("sqlite3");
    if (!sqlite3) throw new Error("sqlite3 unavailable");
  } catch (err) {
    logger.info("sqlite-vss-unavailable", { err: String(err) });
    return undefined;
  }
  return undefined;
}
