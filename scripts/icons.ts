/**
 * Renders the app icon (public/icons/*.svg) to the PNG sizes installing the app needs, the
 * share image link previews show (public/og.png) and the iPhone launch screens
 * (public/splash/). Run with `npm run icons` after changing the artwork or the text on
 * it; the PNGs are committed.
 */
import { chromium, type Browser } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';
import { es } from '../src/i18n/es.ts';
import { IPHONE_SCREENS, launchScreenFile, SCHEMES } from './launch-screens.ts';

const DIR = 'public/icons';

// The rounded icon for browsers and desktop; full-bleed ones for platforms that apply
// their own mask (Android "maskable", iOS home screen).
const ICONS = [
  { source: 'icon.svg', out: 'icon-192.png', size: 192 },
  { source: 'icon.svg', out: 'icon-512.png', size: 512 },
  { source: 'icon-maskable.svg', out: 'maskable-512.png', size: 512 },
  { source: 'icon-maskable.svg', out: 'apple-touch-icon.png', size: 180 },
];

const base64 = (path: string) => readFileSync(path).toString('base64');
const icon = `data:image/svg+xml;base64,${base64(`${DIR}/icon.svg`)}`;
// The game's font, so the images look like the game.
const font = `@font-face {
  font-family: 'Outfit';
  font-weight: 100 900;
  src: url(data:font/woff2;base64,${base64('node_modules/@fontsource-variable/outfit/files/outfit-latin-wght-normal.woff2')});
}`;

/** Screenshots `html` at `width`×`height` CSS pixels (`ratio` device pixels each) into `out`. */
async function render(
  browser: Browser,
  html: string,
  out: string,
  width: number,
  height: number,
  ratio = 1,
) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: ratio });
  await page.setContent(html);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: out, omitBackground: true });
  await page.close();
  console.log(out);
}

// The link preview card, 1200×630 as Open Graph asks: the icon, the name, the tagline and
// the ways to play. Colors are Grama's light theme (src/ui/styles/tokens.css).
const preview = `<style>
  ${font}
  body { margin: 0; width: 1200px; height: 630px; display: flex; align-items: center;
    gap: 64px; padding: 0 96px; box-sizing: border-box; font-family: Outfit;
    background: linear-gradient(#f7f6fc, #e9e7f6); color: #1d1b2e; }
  img { width: 280px; height: 280px; border-radius: 22%;
    box-shadow: 0 12px 40px rgb(29 27 46 / 0.18); }
  h1 { margin: 0; font-size: 128px; line-height: 1; color: #5b5bd6; letter-spacing: 0.04em; }
  p { margin: 20px 0 36px; font-size: 40px; line-height: 1.25; }
  ul { display: flex; gap: 14px; margin: 0; padding: 0; list-style: none; }
  li { padding: 10px 22px; border-radius: 999px; background: #fff; font-size: 26px;
    font-weight: 500; box-shadow: inset 0 0 0 2px #dcd9ec; }
</style>
<img src="${icon}" alt="">
<div>
  <h1>${es.appName}</h1>
  <p>${es.tagline}</p>
  <ul><li>${es.dailyChallenge}</li><li>${es.trial}</li><li>${es.dictionary}</li></ul>
</div>`;

// The iPhone launch screen: Home's header (the icon and the name) on the page's
// background, light or dark, so launching flows into Home.
const COLORS = {
  light: { background: '#f7f6fc', accent: '#5b5bd6' },
  dark: { background: '#16152a', accent: '#8b8bf5' },
};
const launchScreen = (scheme: (typeof SCHEMES)[number]) => `<style>
  ${font}
  body { margin: 0; height: 100vh; display: grid; place-content: center; justify-items: center;
    gap: 16px; font-family: Outfit; background: ${COLORS[scheme].background}; }
  img { width: 96px; height: 96px; border-radius: 22%; }
  h1 { margin: 0; font-size: 40px; color: ${COLORS[scheme].accent}; letter-spacing: 0.04em; }
</style>
<img src="${icon}" alt="">
<h1>${es.appName}</h1>`;

const browser = await chromium.launch();
for (const { source, out, size } of ICONS) {
  const svg = `data:image/svg+xml;base64,${base64(`${DIR}/${source}`)}`;
  const html = `<body style="margin:0"><img src="${svg}" width="${size}" height="${size}"></body>`;
  await render(browser, html, `${DIR}/${out}`, size, size);
}
await render(browser, preview, 'public/og.png', 1200, 630);
mkdirSync('public/splash', { recursive: true });
for (const screen of IPHONE_SCREENS) {
  for (const scheme of SCHEMES) {
    const out = `public/splash/${launchScreenFile(screen, scheme)}`;
    await render(browser, launchScreen(scheme), out, screen.width, screen.height, screen.ratio);
  }
}
await browser.close();
