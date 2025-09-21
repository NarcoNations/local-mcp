import { describe, test } from "vitest";

// Placeholder describing future E2E tests once a Postgres test harness is available.
// Skipped in CI to avoid flakiness without an embedded database.

describe.skip("gold question evaluation", () => {
  test("top results satisfy gold expectations", async () => {
    // This test will import fixtures, index, and run searchCorpus against a
    // temporary Postgres instance. Skipped until controlled harness is added.
  });
});
