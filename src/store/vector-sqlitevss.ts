import { info, warn } from "../utils/logger.js";

export interface SQLiteVectorStore {
  upsert(entries: { id: string; vector: Float32Array }[]): Promise<void>;
  delete(ids: string[]): Promise<void>;
  search(vector: Float32Array, k: number): Promise<{ id: string; score: number }[]>;
  size(): Promise<number>;
}

export async function createSQLiteVectorStore(_dataDir: string): Promise<SQLiteVectorStore | null> {
  let sqlite3: any;
  try {
    sqlite3 = await import("sqlite3");
  } catch (error) {
    info("sqlite-vss-missing", { reason: (error as Error).message });
    return null;
  }
  try {
    const Database = sqlite3.Database;
    if (!Database) {
      info("sqlite-vss-no-database", {});
      return null;
    }
  } catch (error) {
    warn("sqlite-vss-error", { error: (error as Error).message });
    return null;
  }
  info("sqlite-vss-disabled", { reason: "extension unavailable in this build" });
  return null;
}
