/**
 * The installed app's shortcuts: places long-pressing its icon opens, through `?ir=`. No
 * imports, because the build config reads it too (vite.config.ts lists them in the
 * manifest).
 * @module
 */

/** A place an app shortcut opens (long-pressing the installed app's icon). */
export type Shortcut = 'daily' | 'trial' | 'dictionary';

/** The app shortcuts, by their `?ir=` value; the manifest lists them (vite.config.ts). */
export const SHORTCUTS = {
  desafio: 'daily',
  contrarreloj: 'trial',
  diccionario: 'dictionary',
} as const satisfies Record<string, Shortcut>;

/**
 * The shortcut asked for in the page's query string: `?ir=desafio` opens the daily
 * challenge. `null` when absent or unknown.
 * @param search `location.search`.
 */
export function shortcutFromUrl(search: string): Shortcut | null {
  const place = new URLSearchParams(search).get('ir');
  return Object.entries(SHORTCUTS).find(([name]) => name === place)?.[1] ?? null;
}
