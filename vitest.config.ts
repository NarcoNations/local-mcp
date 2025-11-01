import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts", "tests/**/*.integration.test.ts"],
    exclude: ["tests/e2e/**"],
    testTimeout: 30_000,
  },
});

