import { describe, expect, it } from "vitest";
import { createSQLiteVectorStore } from "../src/store/vector-sqlitevss.js";

describe("sqlite fallback", () => {
  it("returns null when sqlite-vss is unavailable", async () => {
    const adapter = await createSQLiteVectorStore("/tmp");
    expect(adapter).toBeNull();
  });
});
