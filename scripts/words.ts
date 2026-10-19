import { spanish } from '../src/core/spanish.ts';

/** Shortest and longest words worth keeping: levels use 3- to 8-letter words. */
export const WORD_LENGTH = { min: 3, max: 8 } as const;

// Lowercase only: drops names and acronyms from the dictionary, plus digits and symbols.
const SPANISH_WORD = /^[a-zñáéíóúü]+$/u;

/**
 * The game's form of a source word, or `null` when it isn't usable.
 * @example gameWord('tenés') // 'TENES'
 * @example gameWord('Juan') // null
 */
export function gameWord(word: string): string | null {
  if (!SPANISH_WORD.test(word)) return null;
  const normalized = spanish.normalize(word);
  const fits = normalized.length >= WORD_LENGTH.min && normalized.length <= WORD_LENGTH.max;
  return fits ? normalized : null;
}

/**
 * Usable source words in the game's form, keeping the first occurrence of each.
 * @param blocked Game-form words to leave out.
 */
export function gameWords(
  words: Iterable<string>,
  blocked: ReadonlySet<string> = new Set(),
): string[] {
  const kept = new Set<string>();
  for (const word of words) {
    const usable = gameWord(word);
    if (usable && !blocked.has(usable)) kept.add(usable);
  }
  return [...kept];
}
