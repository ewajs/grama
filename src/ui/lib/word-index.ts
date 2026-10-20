/**
 * Tu diccionario's words as a dictionary shows them: alphabetical, grouped by first letter.
 * @module
 */

import { spanish } from '../../core/spanish';

/** The words starting with one letter. */
export type LetterGroup = { letter: string; words: string[] };

/**
 * Normalized words in alphabetical order (Spanish: `Ñ` after `N`), grouped by first
 * letter, keeping only those that start with what's searched (accents and case ignored).
 * @example wordIndex(['SOL', 'ÑANDU', 'SAL', 'NIDO']) // N: NIDO · Ñ: ÑANDU · S: SAL, SOL
 */
export function wordIndex(words: readonly string[], search = ''): LetterGroup[] {
  const start = spanish.normalize(search.trim());
  const groups: LetterGroup[] = [];
  const matching = words.filter((word) => word.startsWith(start));
  for (const word of matching.toSorted((a, b) => a.localeCompare(b, 'es'))) {
    const letter = word[0] ?? '';
    const last = groups.at(-1);
    if (last?.letter === letter) last.words.push(word);
    else groups.push({ letter, words: [word] });
  }
  return groups;
}
