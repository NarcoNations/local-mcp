import { createRequire } from "module";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("vector-sqlite");
const require = createRequire(import.meta.url);

export interface SQLiteVectorIndex {
  load(): Promise<void>;
  setVector(chunkId: string, vector: Float32Array): void;
  removeVectors(chunkIds: string[]): void;
  search(query: Float32Array, k: number): Promise<Array<{ chunkId: string; score: number }>>;
  size(): number;
  persist(): Promise<void>;
}

export async function tryCreateSQLiteVSS(_dir: string): Promise<SQLiteVectorIndex | undefined> {
  try {
    require("sqlite3");
    logger.info("sqlite_vss_not_configured", { message: "sqlite-vss support is not implemented in this build" });
  } catch (err) {
    logger.info("sqlite_vss_unavailable", { reason: String(err) });
  }
  return undefined;
}
