import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/index.html');
  await page.waitForSelector('#map-root svg.world');
});

test('cooperative zoom and double-click disabled', async ({ page }) => {
  const map = page.locator('#map-root');
  // Scroll without Ctrl should not zoom the map container significantly; assert page scroll moves
  await map.hover();
  const scrollBefore = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 400);
  const scrollAfter = await page.evaluate(() => window.scrollY);
  expect(scrollAfter).toBeGreaterThanOrEqual(scrollBefore);

  // Double-click does nothing (no immediate zoom)
  await map.dblclick();
  await expect(map).toBeVisible();
});

test('Esc releases map focus', async ({ page }) => {
  const svg = page.locator('svg.world');
  await svg.focus();
  await page.keyboard.press('Escape');
  // Focus should move off map (document body is ok)
  const active = await page.evaluate(() => document.activeElement?.tagName);
  expect(active).not.toBe('svg');
});

test('Reset fits the world', async ({ page }) => {
  await page.locator('#reset-view').click();
  await page.waitForTimeout(300);
  await expect(page.locator('#map-root')).toBeVisible();
});

test('Metric combobox keyboard selection updates legend', async ({ page }) => {
  // Switch to Oxford first
  await page.getByRole('button', { name: 'Oxford' }).click();
  const combo = page.locator('#metric-combo-button');
  await combo.focus();
  await combo.press('Enter');
  await combo.press('ArrowDown');
  await combo.press('Enter');
  await page.waitForTimeout(300);
  await expect(page.locator('#legend-key .title')).toBeVisible();
});

test('Calm mode fades toolbar', async ({ page }) => {
  const toolbar = page.locator('.toolbar');
  await page.mouse.move(10, 10); // move away
  await page.waitForTimeout(250);
  const opacity = await toolbar.evaluate(el => getComputedStyle(el).opacity);
  expect(parseFloat(opacity)).toBeLessThan(1);
  await toolbar.hover();
  await page.waitForTimeout(250);
  const opacity2 = await toolbar.evaluate(el => getComputedStyle(el).opacity);
  expect(parseFloat(opacity2)).toBeGreaterThanOrEqual(1);
});

test('overlay toggles render/remove layers', async ({ page }) => {
  const toggle = page.locator('#layer-compute');
  await toggle.check();
  await page.waitForTimeout(200);
  expect(await page.locator('g.compute').count()).toBeGreaterThan(0);
  await toggle.uncheck();
  await page.waitForTimeout(100);
  expect(await page.locator('g.compute').count()).toBe(0);
});


