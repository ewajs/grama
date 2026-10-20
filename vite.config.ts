import { svelte } from '@sveltejs/vite-plugin-svelte';
import { readFileSync } from 'node:fs';
import type { HtmlTagDescriptor, Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';
import {
  IPHONE_SCREENS,
  launchScreenFile,
  launchScreenMedia,
  SCHEMES,
} from './scripts/launch-screens';
import { SHORTCUTS } from './src/app/start';
import { es } from './src/i18n/es';

// GitHub Pages serves the app from https://ewajs.github.io/grama/
const base = '/grama/';
const site = `https://ewajs.github.io${base}`;
const background = '#f7f6fc'; // --color-bg-top, light theme

/** Meta tags for the page's head. */
function meta(attributes: Record<string, string>): HtmlTagDescriptor {
  return { tag: 'meta', attrs: attributes, injectTo: 'head' };
}

/**
 * What a shared link to the game shows in chats and social apps (Open Graph): the name, a
 * description and the card `npm run icons` renders to public/og.png.
 */
function linkPreviews(): Plugin {
  const properties = {
    'og:type': 'website',
    'og:site_name': es.appName,
    'og:title': es.appName,
    'og:description': es.preview,
    'og:url': site,
    'og:locale': 'es_AR',
    'og:image': `${site}og.png`,
    'og:image:width': '1200',
    'og:image:height': '630',
    'og:image:alt': es.previewAlt,
  };
  return {
    name: 'grama:link-previews',
    transformIndexHtml: () => [
      ...Object.entries(properties).map(([property, content]) => meta({ property, content })),
      meta({ name: 'twitter:card', content: 'summary_large_image' }),
    ],
  };
}

/**
 * The installed app on iPhone: its name under the icon, and a launch screen per iPhone
 * size (`npm run icons` renders them to public/splash/), instead of a blank one.
 */
function iphoneApp(): Plugin {
  return {
    name: 'grama:iphone-app',
    transformIndexHtml: () => [
      meta({ name: 'apple-mobile-web-app-capable', content: 'yes' }),
      meta({ name: 'apple-mobile-web-app-title', content: es.appName }),
      ...IPHONE_SCREENS.flatMap((screen) =>
        SCHEMES.map((scheme): HtmlTagDescriptor => ({
          tag: 'link',
          attrs: {
            rel: 'apple-touch-startup-image',
            href: `${base}splash/${launchScreenFile(screen, scheme)}`,
            media: launchScreenMedia(screen, scheme),
          },
          injectTo: 'head',
        })),
      ),
    ],
  };
}

export default defineConfig({
  base,
  define: {
    // The release (package.json, bumped with each milestone tag) and the commit it was
    // built from (CI; local builds say so).
    __VERSION__: JSON.stringify(JSON.parse(readFileSync('package.json', 'utf8')).version),
    __BUILD__: JSON.stringify(process.env.GITHUB_SHA?.slice(0, 7) ?? 'local'),
  },
  plugins: [
    svelte(),
    linkPreviews(),
    iphoneApp(),
    // Installable app that works offline: the service worker caches the app and the
    // word lists; a new version waits until the player accepts it (UpdatePrompt).
    VitePWA({
      registerType: 'prompt',
      manifest: {
        id: base,
        name: es.appName,
        short_name: es.appName,
        description: es.preview,
        categories: ['games', 'education', 'entertainment'],
        lang: 'es-AR',
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'portrait',
        background_color: background,
        theme_color: background,
        // Long-pressing the installed app's icon offers these (see `shortcutFromUrl`).
        shortcuts: Object.entries(SHORTCUTS).map(([name, place]) => ({
          name: { daily: es.dailyChallenge, trial: es.trial, dictionary: es.dictionary }[place],
          url: `${base}?ir=${name}`,
          icons: [{ src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
        })),
        // The install dialog's screenshots: the guide's own (`npm run guide:screenshots`),
        // served from /grama/guia/ next to the game.
        screenshots: Object.entries(es.installScreenshots).map(([name, label]) => ({
          src: `guia/screenshots/${name}.png`,
          type: 'image/png',
          ...(name === 'escritorio'
            ? { sizes: '1280x800', form_factor: 'wide' }
            : { sizes: '780x1688', form_factor: 'narrow' }),
          label,
        })),
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,txt}'],
        // Only link previews fetch the share card, and iOS fetches its launch screen once,
        // when the app is added: players never need them offline.
        globIgnores: ['og.png', 'splash/**'],
        // The dictionary is ~1.1 MB uncompressed.
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        // The guide and the developer docs are their own sites under the same path: the
        // app's offline fallback must not answer for them.
        navigateFallbackDenylist: [/\/guia\//, /\/docs\//],
      },
    }),
  ],
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
    passWithNoTests: true,
  },
});
