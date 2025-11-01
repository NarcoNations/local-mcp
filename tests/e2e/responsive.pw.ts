import { test, expect } from "@playwright/test";

test.describe("Control room responsiveness", () => {
  test("adjusts layout and typography from mobile to desktop", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const mobileColumns = await page
      .locator("main.content")
      .evaluate((el) => getComputedStyle(el).gridTemplateColumns);
    const mobileColumnCount = mobileColumns.split(" ").filter(Boolean).length;
    expect(mobileColumnCount).toBe(1);

    const mobileFontSize = await page
      .locator(".hero h1")
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(mobileFontSize).toBeGreaterThan(0);

    const mobileAppWidth = await page
      .locator(".app")
      .evaluate((el) => el.getBoundingClientRect().width);
    expect(mobileAppWidth).toBeLessThanOrEqual(375);

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(200);

    const desktopColumns = await page
      .locator("main.content")
      .evaluate((el) => getComputedStyle(el).gridTemplateColumns);
    const desktopColumnCount = desktopColumns.split(" ").filter(Boolean).length;
    expect(desktopColumnCount).toBeGreaterThan(1);

    const desktopFontSize = await page
      .locator(".hero h1")
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(desktopFontSize).toBeGreaterThan(mobileFontSize);

    const desktopAppWidth = await page
      .locator(".app")
      .evaluate((el) => el.getBoundingClientRect().width);
    expect(desktopAppWidth).toBeLessThanOrEqual(1100);
  });

  test("maintains comfortable spacing at tablet breakpoint", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const panelPadding = await page
      .locator(".panel")
      .first()
      .evaluate((el) =>
        getComputedStyle(el)
          .padding.split(" ")
          .map((value) => parseFloat(value))
      );
    expect(panelPadding.every((value) => value >= 16)).toBe(true);

    const chipWrap = await page
      .locator(".status-chips")
      .evaluate((el) => getComputedStyle(el).flexWrap);
    expect(chipWrap).toBe("wrap");

    const heroPaddingTop = await page
      .locator(".hero")
      .evaluate((el) => parseFloat(getComputedStyle(el).paddingTop));
    expect(heroPaddingTop).toBeGreaterThanOrEqual(24);
  });
});
