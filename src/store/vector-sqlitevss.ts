import path from "path";
import { logger } from "../utils/logger.js";

export interface SQLiteVectorStore {
  upsert(records: { id: string; vector: Float32Array }[]): Promise<void>;
  remove(ids: string[]): Promise<void>;
  search(vector: Float32Array, k: number): Promise<Array<{ id: string; score: number }>>;
  close(): Promise<void>;
}

export async function createSQLiteVectorStore(dataDir: string): Promise<SQLiteVectorStore | null> {
  try {
    const sqlite3 = await import("sqlite3").catch(() => null);
    if (!sqlite3) {
      throw new Error("sqlite3 not installed");
    }
    const { Database } = sqlite3 as any;
    const dbPath = path.join(dataDir, "vectors.sqlite");
    const db = new Database(dbPath);
    await new Promise<void>((resolve, reject) => {
      db.serialize(() => {
        db.run("PRAGMA journal_mode=WAL", (err: any) => {
          if (err) reject(err);
        });
        db.run(
          "CREATE TABLE IF NOT EXISTS vectors (id TEXT PRIMARY KEY, vector BLOB NOT NULL)",
          (err: any) => {
            if (err) reject(err);
          },
        );
        resolve();
      });
    });

    const store: SQLiteVectorStore = {
      async upsert(records) {
        await new Promise<void>((resolve, reject) => {
          const stmt = db.prepare("INSERT OR REPLACE INTO vectors (id, vector) VALUES (?, ?)");
          for (const record of records) {
            const buffer = Buffer.alloc(record.vector.length * 4);
            for (let i = 0; i < record.vector.length; i += 1) {
              buffer.writeFloatLE(record.vector[i], i * 4);
            }
            stmt.run(record.id, buffer);
          }
          stmt.finalize((err: any) => {
            if (err) reject(err);
            else resolve();
          });
        });
      },
      async remove(ids) {
        await new Promise<void>((resolve, reject) => {
          const stmt = db.prepare("DELETE FROM vectors WHERE id = ?");
          for (const id of ids) {
            stmt.run(id);
          }
          stmt.finalize((err: any) => {
            if (err) reject(err);
            else resolve();
          });
        });
      },
      async search(vector, k) {
        // Without sqlite-vss extension, provide naive scan similar to flat store.
        const vectors: Array<{ id: string; vector: Float32Array }> = await new Promise((resolve, reject) => {
          db.all("SELECT id, vector FROM vectors", (err: any, rows: any[]) => {
            if (err) {
              reject(err);
            } else {
              resolve(
                rows.map((row: any) => {
                  const buf: Buffer = row.vector;
                  const arr = new Float32Array(buf.length / 4);
                  for (let i = 0; i < arr.length; i += 1) {
                    arr[i] = buf.readFloatLE(i * 4);
                  }
                  return { id: row.id, vector: arr };
                }),
              );
            }
          });
        });
        const queryNorm = Math.sqrt(vector.reduce((acc, v) => acc + v * v, 0));
        const results: Array<{ id: string; score: number }> = [];
        for (const item of vectors) {
          const norm = Math.sqrt(item.vector.reduce((acc, v) => acc + v * v, 0));
          let dot = 0;
          const dim = Math.min(vector.length, item.vector.length);
          for (let i = 0; i < dim; i += 1) {
            dot += vector[i] * item.vector[i];
          }
          const denom = (queryNorm || 1) * (norm || 1);
          const score = denom === 0 ? 0 : dot / denom;
          results.push({ id: item.id, score });
        }
        return results.sort((a, b) => b.score - a.score).slice(0, k);
      },
      async close() {
        await new Promise<void>((resolve, reject) => {
          db.close((err: any) => {
            if (err) reject(err);
            else resolve();
          });
        });
      },
    };

    logger.info("sqlite-vector-store", { status: "enabled" });
    return store;
  } catch (err: any) {
    logger.info("sqlite-vector-store", { status: "unavailable", reason: err?.message ?? String(err) });
    return null;
  }
}
