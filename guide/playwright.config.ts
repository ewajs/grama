import { defineConfig } from '@playwright/test';

const port = 4174;

// Takes the guide's screenshots from the real game (npm run guide:screenshots).
export default defineConfig({
  testDir: '.',
  testMatch: 'screenshots.spec.ts',
  use: {
    baseURL: `http://localhost:${port}/grama/`,
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  },
  webServer: {
    command: `npm run build && npm run preview -- --port ${port} --strictPort`,
    url: `http://localhost:${port}/grama/`,
    reuseExistingServer: true,
  },
});
