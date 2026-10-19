/**
 * The performance budget: fails when the built app's JavaScript grows past what a phone
 * should download before the first level. Run after `npm run build`.
 * @module
 */

import { readdirSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

/** Most JavaScript the app may ship, gzipped, in kilobytes. */
const JS_BUDGET_KB = 100;

const dir = 'dist/assets';
const scripts = readdirSync(dir).filter((file) => file.endsWith('.js'));
const kb =
  scripts.reduce((sum, file) => sum + gzipSync(readFileSync(`${dir}/${file}`)).length, 0) / 1024;

console.log(`JavaScript: ${kb.toFixed(1)} KB gzipped (budget ${JS_BUDGET_KB} KB)`);
if (kb > JS_BUDGET_KB) {
  console.error('Over budget: find what grew (npx vite-bundle-visualizer) before raising it.');
  process.exit(1);
}
