import { describe, it, expect } from "vitest";
import { tryCreateSQLiteVSS } from "../src/store/vector-sqlitevss.js";

describe("vector-sqlitevss", () => {
  it("falls back gracefully when sqlite3 is unavailable", async () => {
    const adapter = await tryCreateSQLiteVSS(".mcp-nn");
    expect(adapter).toBeUndefined();
  });
});
