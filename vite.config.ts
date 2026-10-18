import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // GitHub Pages serves the app from https://<user>.github.io/grama/
  base: '/grama/',
  plugins: [svelte()],
  test: {
    include: ['src/**/*.test.ts'],
    passWithNoTests: true,
  },
});
