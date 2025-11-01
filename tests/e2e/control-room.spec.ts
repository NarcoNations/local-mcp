import { test, expect } from "@playwright/test";
import path from "node:path";
import { pathToFileURL } from "node:url";

const indexUrl = pathToFileURL(path.resolve("public/index.html")).toString();

test.describe("Control Room UI responsiveness", () => {
  test("optimises layout for mobile viewports", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(indexUrl);

    await expect(page.locator(".hero h1")).toBeVisible();
    const gridTemplate = await page.locator("main.content").evaluate((el) => getComputedStyle(el).gridTemplateColumns);
    expect(gridTemplate.trim()).toBe("none");

    const hasOverflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 1);
    expect(hasOverflow).toBe(false);

    const formActions = page.locator(".form-actions button");
    await expect(formActions.first()).toHaveCSS("width", /\d+px/);
    const widths = await formActions.evaluateAll((nodes) => nodes.map((node) => node.clientWidth));
    expect(widths.every((width) => width >= 300)).toBe(true);
  });

  test("expands grid layout on large screens", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(indexUrl);

    const gridTemplate = await page.locator("main.content").evaluate((el) => getComputedStyle(el).gridTemplateColumns);
    expect(gridTemplate.trim()).not.toBe("none");

    const appWidth = await page.locator(".app").evaluate((el) => el.clientWidth);
    expect(appWidth).toBeGreaterThan(1000);
  });
});

