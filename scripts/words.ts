import { spanish } from '../src/core/spanish.ts';

/** Shortest and longest words worth keeping: levels use 3- to 8-letter words. */
export const WORD_LENGTH = { min: 3, max: 8 } as const;

// Lowercase only: drops names and acronyms from the dictionary, plus digits and symbols.
const SPANISH_WORD = /^[a-zñáéíóúü]+$/u;

/**
 * How a source word is written in the shipped lists (uppercase, accents kept), or `null`
 * when it isn't usable.
 * @example spelling('tenés') // 'TENÉS'
 * @example spelling('Juan') // null
 */
export function spelling(word: string): string | null {
  if (!SPANISH_WORD.test(word)) return null;
  const written = word.normalize('NFC').toLocaleUpperCase('es');
  const length = spanish.normalize(written).length;
  return length >= WORD_LENGTH.min && length <= WORD_LENGTH.max ? written : null;
}

/** A spelling, and its position in the source list it came from (0 is first). */
export type Seen = { written: string; position: number };

/** Options for {@link spellings}. */
export type SpellingOptions = {
  /** Words to leave out, as the game compares them (no accents). */
  blocked?: ReadonlySet<string>;
  /** Whether `candidate` should replace `current`, a spelling of the same word seen earlier. */
  prefer?: (candidate: Seen, current: Seen) => boolean;
};

/**
 * Usable source words, written for the shipped lists. Words the game can't tell apart
 * (they only differ in accents) are kept once, where the first of them appears, written
 * the first way seen unless `prefer` picks a later one.
 */
export function spellings(
  words: Iterable<string>,
  { blocked = new Set(), prefer = () => false }: SpellingOptions = {},
): string[] {
  const kept = new Map<string, Seen>();
  let position = 0;
  for (const word of words) {
    const written = spelling(word);
    const candidate = { written: written ?? '', position: position++ };
    if (!written) continue;
    const compared = spanish.normalize(written);
    if (blocked.has(compared)) continue;
    const current = kept.get(compared);
    if (current === undefined || prefer(candidate, current)) kept.set(compared, candidate);
  }
  return [...kept.values()].map(({ written }) => written);
}

/**
 * How many times rarer an accented spelling may be and still be preferred. Frequency
 * sources often drop accents: "tenes" ranks above "tenés".
 */
export const ACCENT_TOLERANCE = 3;

const hasAccents = (written: string) => written !== spanish.normalize(written);

/**
 * Chooses between spellings of a word in a frequency list: a proper one (e.g. in the
 * dictionary) beats one that isn't; between proper ones, the accented one wins unless it
 * is over {@link ACCENT_TOLERANCE} times rarer.
 * @example tenes (#2153) vs tenés (#5586): TENÉS. este (#33) vs éste (#1014): ESTE.
 */
export function preferSpelling(proper: (written: string) => boolean) {
  return (candidate: Seen, current: Seen): boolean => {
    if (!proper(candidate.written)) return false;
    if (!proper(current.written)) return true;
    return (
      hasAccents(candidate.written) &&
      !hasAccents(current.written) &&
      candidate.position + 1 <= ACCENT_TOLERANCE * (current.position + 1)
    );
  };
}
