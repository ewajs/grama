import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

// GitHub Pages serves the app from https://<user>.github.io/grama/
const base = '/grama/';
const background = '#f7f6fc'; // --color-bg-top, light theme

export default defineConfig({
  base,
  define: {
    // CI builds name their commit; local builds say so.
    __BUILD__: JSON.stringify(process.env.GITHUB_SHA?.slice(0, 7) ?? 'local'),
  },
  plugins: [
    svelte(),
    // Installable app that works offline: the service worker caches the app and the
    // word lists; a new version waits until the player accepts it (UpdatePrompt).
    VitePWA({
      registerType: 'prompt',
      manifest: {
        name: 'Grama',
        short_name: 'Grama',
        description: 'Uní las letras y encontrá todas las palabras.',
        lang: 'es-AR',
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'portrait',
        background_color: background,
        theme_color: background,
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
        // The dictionary is ~1.1 MB uncompressed.
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        // The guide and the developer docs are their own sites under the same path: the
        // app's offline fallback must not answer for them.
        navigateFallbackDenylist: [/\/guia\//, /\/docs\//, /\/api\//],
      },
    }),
  ],
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
    passWithNoTests: true,
  },
});
