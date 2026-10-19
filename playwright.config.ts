import { defineConfig, devices } from '@playwright/test';

const port = 4173;

export default defineConfig({
  testDir: 'tests/e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  use: {
    trace: 'on-first-retry',
    baseURL: `http://localhost:${port}/grama/`,
    // Tests start past the first-launch tutorial; tutorial.test.ts starts fresh.
    storageState: 'tests/e2e/tutorial-seen.json',
  },
  // A touch phone (Chromium, real touch drags), an iPhone (WebKit, Safari's engine) and a
  // desktop with a mouse.
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    { name: 'iphone', use: { ...devices['iPhone 13'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
  // Test the production build, not the dev server.
  webServer: {
    command: `npm run build && npm run preview -- --port ${port} --strictPort`,
    url: `http://localhost:${port}/grama/`,
    reuseExistingServer: !process.env.CI,
  },
});
