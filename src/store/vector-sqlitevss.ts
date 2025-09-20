import path from "node:path";
import { logger } from "../utils/logger.js";

export interface SQLiteVectorIndex {}

export async function createSQLiteIndex(_dbPath: string): Promise<SQLiteVectorIndex | undefined> {
  try {
    await import("sqlite3");
  } catch (err) {
    logger.info("sqlite-optional-missing", { error: (err as Error).message });
    return undefined;
  }
  logger.info("sqlite-vss-unavailable", { msg: "placeholder fallback to flat index" });
  return undefined;
}
