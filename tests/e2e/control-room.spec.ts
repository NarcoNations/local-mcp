import { test, expect } from "@playwright/test";

test.describe("Control Room UI – desktop", () => {
  test("search, stats, and maintenance flows render successfully", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Local Research MCP Control Room");
    await expect(page.locator("#status-files")).toHaveText("1");
    await expect(page.locator("#stat-markdown")).toHaveText("3");

    await page.fill("#query", "antwerp operations");
    const searchResponsePromise = page.waitForResponse("**/api/search");
    await page.click('#search-form button[type="submit"]');
    const searchResponse = await searchResponsePromise;
    const searchPayload = await searchResponse.request().postDataJSON();
    expect(searchPayload.query).toBe("antwerp operations");

    const resultCard = page.locator(".result-card").first();
    await expect(resultCard.locator(".result-title")).toContainText("counter-narcotics");

    const docResponsePromise = page.waitForResponse("**/api/doc");
    await resultCard.locator("summary").click();
    const docResponse = await docResponsePromise;
    const docBody = await docResponse.json();
    expect(docBody.ok).toBe(true);
    await expect(resultCard.locator(".result-text")).toContainText("Full dossier for reports/counter-narcotics.md");

    await page.click("#clear-results");
    await expect(page.locator("#results p")).toHaveText(/No results yet/i);

    await page.click("#refresh-stats");
    await expect(page.locator("#last-indexed")).toContainText("Last indexed:");

    await page.fill("#reindex-path", "./docs");
    const reindexResponsePromise = page.waitForResponse("**/api/reindex");
    await page.click('#reindex-form button[type="submit"]');
    const reindexResponse = await reindexResponsePromise;
    const reindexPayload = await reindexResponse.request().postDataJSON();
    expect(reindexPayload.paths).toEqual(["./docs"]);
    await expect(page.locator("#control-feedback")).toContainText(/Reindexed:/);

    await page.fill("#watch-paths", "./docs, ./public");
    const watchResponsePromise = page.waitForResponse("**/api/watch");
    await page.click('#watch-form button[type="submit"]');
    const watchResponse = await watchResponsePromise;
    const watchPayload = await watchResponse.request().postDataJSON();
    expect(watchPayload.paths).toEqual(["./docs", "./public"]);
    await expect(page.locator("#control-feedback")).toContainText(/Watching 2/);

    await page.fill("#import-export", "./exports");
    await page.fill("#import-out", "./docs/chatgpt-export-md");
    const importResponsePromise = page.waitForResponse("**/api/import");
    await page.click('#import-form button[type="submit"]');
    await importResponsePromise;
    await expect(page.locator("#control-feedback")).toContainText(/Imported/);

    await expect(page.locator(".log-entry").first()).toContainText("control-room-ready");
    await page.waitForTimeout(700);
    await expect(
      page.locator(".log-entry").filter({ hasText: /watch-event|reindex-complete/ })
    ).not.toHaveCount(0);
  });
});

test.describe("Control Room UI – mobile", () => {
  test.use({ viewport: { width: 414, height: 896 } });

  test("maintains a single-column layout without overflow", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".hero")).toBeVisible();
    const gridColumns = await page.evaluate(() => {
      const el = document.querySelector("main.content");
      return el ? getComputedStyle(el).gridTemplateColumns : "";
    });
    expect(gridColumns === "none" || gridColumns.split(" ").length === 1).toBeTruthy();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await expect(page.locator("#results")).toBeVisible();
  });
});
