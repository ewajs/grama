import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: 'learning.spec.ts',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: 'http://localhost:4174/grama/guia/' },
  // The game build is already produced by the regular e2e job; build only the guide here.
  webServer: {
    command: 'npm run guide && npm run preview -- --port 4174 --strictPort',
    url: 'http://localhost:4174/grama/guia/',
    reuseExistingServer: !process.env.CI,
  },
});
