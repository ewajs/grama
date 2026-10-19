/**
 * Where a word's definition is.
 * @module
 */

/**
 * Where a word's definition is: the Real Academia Española's dictionary (DLE). Some
 * Argentine words aren't in it; the page says so.
 * @param written The word as written, with its accents.
 */
export function definitionUrl(written: string): string {
  return `https://dle.rae.es/${encodeURIComponent(written.toLocaleLowerCase('es'))}`;
}
