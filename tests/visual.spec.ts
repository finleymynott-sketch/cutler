import { test, expect } from '@playwright/test';

async function worldView(page) {
  await page.goto('/index.html');
  await page.waitForSelector('#map-root svg.world');
}

test.describe('Visual baselines', () => {
  test('world view', async ({ page }) => {
    await worldView(page);
    await expect(page.locator('#map-root')).toHaveScreenshot('world.png', { maxDiffPixels: 2000 });
  });

  test('zoomed country', async ({ page }) => {
    await worldView(page);
    // Focus and click on a known country (e.g., Brazil) by text in aria-label
    const country = page.locator('svg.world path.country[aria-label="Brazil"]');
    await country.first().click();
    await page.waitForTimeout(900);
    await expect(page.locator('#map-root')).toHaveScreenshot('country-zoom.png', { maxDiffPixels: 2500 });
  });

  test('Oxford Overall (Absolute)', async ({ page }) => {
    await worldView(page);
    await page.selectOption('#layer-select', 'oxford');
    await page.waitForTimeout(200);
    await expect(page.locator('#map-root')).toHaveScreenshot('oxford-overall-absolute.png', { maxDiffPixels: 3000 });
  });

  test('Oxford Overall (Quantile)', async ({ page }) => {
    await worldView(page);
    await page.selectOption('#layer-select', 'oxford');
    await page.selectOption('#oxford-scale', 'quantile');
    await page.waitForTimeout(200);
    await expect(page.locator('#map-root')).toHaveScreenshot('oxford-overall-quantile.png', { maxDiffPixels: 3000 });
  });

  test('Oxford Government (Absolute)', async ({ page }) => {
    await worldView(page);
    await page.selectOption('#layer-select', 'oxford');
    await page.selectOption('#oxford-metric', 'government');
    await page.waitForTimeout(200);
    await expect(page.locator('#map-root')).toHaveScreenshot('oxford-government-absolute.png', { maxDiffPixels: 3000 });
  });

  test('Reset returns to world view', async ({ page }) => {
    await worldView(page);
    const btn = page.locator('#reset-view');
    await btn.click();
    await page.waitForTimeout(400);
    await expect(page.locator('#map-root')).toHaveScreenshot('reset-world.png', { maxDiffPixels: 2000 });
  });
});


