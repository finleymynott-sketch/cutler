import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('atlas has no critical accessibility violations', async ({ page }) => {
  await page.goto('/index.html');
  await page.waitForSelector('#map-root svg.world');
  const results = await new AxeBuilder({ page })
    .exclude('.noscript')
    .analyze();
  const critical = results.violations.filter(v => ['critical', 'serious'].includes(v.impact || ''));
  expect(critical).toEqual([]);
});


