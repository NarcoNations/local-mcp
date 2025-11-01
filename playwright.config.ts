import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/ui",
  fullyParallel: false,
  reporter: "list",
  projects: [
    {
      name: "desktop-chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: "mobile-chromium",
      use: {
        ...devices["Pixel 5"],
      },
    },
  ],
  use: {
    trace: "on-first-retry",
    baseURL: undefined,
  },
});
