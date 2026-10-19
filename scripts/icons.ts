/**
 * Renders the app icon (public/icons/*.svg) to the PNG sizes installing the app needs.
 * Run with `npm run icons` after changing the artwork; the PNGs are committed.
 */
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';

const DIR = 'public/icons';

// The rounded icon for browsers and desktop; full-bleed ones for platforms that apply
// their own mask (Android "maskable", iOS home screen).
const ICONS = [
  { source: 'icon.svg', out: 'icon-192.png', size: 192 },
  { source: 'icon.svg', out: 'icon-512.png', size: 512 },
  { source: 'icon-maskable.svg', out: 'maskable-512.png', size: 512 },
  { source: 'icon-maskable.svg', out: 'apple-touch-icon.png', size: 180 },
];

const browser = await chromium.launch();
for (const { source, out, size } of ICONS) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  const svg = readFileSync(`${DIR}/${source}`).toString('base64');
  await page.setContent(
    `<body style="margin:0"><img src="data:image/svg+xml;base64,${svg}" width="${size}" height="${size}"></body>`,
  );
  await page.screenshot({ path: `${DIR}/${out}`, omitBackground: true });
  await page.close();
  console.log(`${DIR}/${out}`);
}
await browser.close();
