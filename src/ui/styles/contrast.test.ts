/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Read from disk: Vitest empties CSS imports, `?raw` included.
const tokens = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8');

/** A color as light and dark: `light-dark(#light, #dark)` in tokens.css. */
type Pair = [light: string, dark: string];

function colorsIn(css: string): Record<string, Pair> {
  const colors: Record<string, Pair> = {};
  for (const [, name, light, dark] of css.matchAll(
    /--color-([\w-]+): light-dark\((#[0-9a-f]{6}), (#[0-9a-f]{6})\)/g,
  )) {
    colors[name!] = [light!, dark!];
  }
  return colors;
}

const shared = colorsIn(tokens.slice(tokens.lastIndexOf(':root {')));
const themes = [...tokens.matchAll(/\[data-theme='(\w+)'\] \{([^}]*)\}/g)].map(
  ([, name, body]) => ({ name: name!, colors: { ...shared, ...colorsIn(body!) } }),
);

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((start) => {
    const channel = parseInt(hex.slice(start, start + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

/** WCAG contrast ratio between two colors, from 1 to 21. */
function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light! + 0.05) / (dark! + 0.05);
}

// Text and what it's read on, as tokens.css describes them; 4.5:1 is WCAG AA.
const PAIRS: [text: string, background: string][] = [
  ...['surface', 'bg-top', 'tile'].flatMap((background) => [
    ['text', background] as [string, string],
    ['text-muted', background] as [string, string],
    ['accent-strong', background] as [string, string],
  ]),
  ['accent-contrast', 'accent'],
  ['on-strong', 'accent-strong'],
  ...['success', 'bonus', 'danger'].flatMap((status) => [
    [`${status}-strong`, 'surface'] as [string, string],
    [`${status}-strong`, 'tile'] as [string, string],
    ['on-strong', `${status}-strong`] as [string, string],
  ]),
];

describe('themes', () => {
  it('are all found in tokens.css', () => {
    expect(themes.map((theme) => theme.name)).toEqual(['grama', 'argento', 'yerba', 'quebrada']);
  });

  describe.each(themes)('$name', ({ colors }) => {
    it.each(['light', 'dark'] as const)('passes WCAG AA in %s mode', (mode) => {
      const index = mode === 'light' ? 0 : 1;
      const failing = PAIRS.filter(([text, background]) => {
        const [a, b] = [colors[text]?.[index], colors[background]?.[index]];
        return !a || !b || contrast(a, b) < 4.5;
      });
      expect(failing).toEqual([]);
    });
  });
});
