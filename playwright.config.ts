import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  /* Maximum time one test can run for. */
  timeout: 60_000,
  expect: { toMatchSnapshot: { threshold: 0.2 } },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    { name: 'Chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'Firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'WebKit', use: { ...devices['Desktop Safari'] } },
    { name: 'iPhone 12', use: { ...devices['iPhone 12'] } },
    { name: 'Pixel 5', use: { ...devices['Pixel 5'] } }
  ],
  webServer: process.env.CI
    ? [{ command: 'npx http-server -p 5173 -c-1 .', port: 5173, reuseExistingServer: !process.env.CI }]
    : undefined
});


