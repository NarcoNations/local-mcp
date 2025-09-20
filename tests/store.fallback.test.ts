import { describe, expect, test } from "vitest";
import { createSQLiteVectorStore } from "../src/store/vector-sqlitevss.js";

describe("sqlite fallback", () => {
  test("returns null when sqlite3 is unavailable", async () => {
    const store = await createSQLiteVectorStore("./tmp");
    expect(store).toBeNull();
  });
});
