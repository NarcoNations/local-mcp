import { test, expect } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const controlRoomPath = path.resolve(__dirname, "../../public/index.html");
const controlRoomUrl = `file://${controlRoomPath}`;

test.describe("control room UI", () => {
  test("renders hero and control panels", async ({ page }) => {
    await page.goto(controlRoomUrl);

    await expect(page.getByRole("heading", { level: 1, name: /control room/i })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: /search corpus/i })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: /activity log/i })).toBeVisible();
  });

  test("adapts layout to viewport", async ({ page }) => {
    await page.goto(controlRoomUrl);
    const content = page.locator("main.content");
    await expect(content).toBeVisible();

    const columns = await content.evaluate((element) =>
      getComputedStyle(element).getPropertyValue("grid-template-columns").trim(),
    );

    expect(columns.length).toBeGreaterThan(0);

    const width = (await page.viewportSize())?.width ?? 1280;
    const segments = columns === "none" ? ["auto"] : columns.split(/\s+/);

    if (width <= 600) {
      expect(segments.length).toBe(1);
    } else {
      expect(segments.length).toBeGreaterThanOrEqual(2);
    }
  });
});
