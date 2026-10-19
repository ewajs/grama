import type { Language } from '../core/language';

/** A language's words, ready to play with. */
export type WordList = {
  /** Every valid word as the game compares them, most common first: `generateLevel`'s input. */
  words: string[];
  /** How each word is written, accents included: `TENES` → `TENÉS`. */
  spellings: ReadonlyMap<string, string>;
};

/**
 * The words of a shipped word-list file: one per line; `#` lines are its license header.
 */
export function parseWordList(text: string): string[] {
  return text.split('\n').filter((line) => line !== '' && !line.startsWith('#'));
}

/**
 * Combines a language's two lists into every valid word, most common first. Frequent
 * words that are also in the dictionary lead, in frequency order; they're the only ones
 * common enough to be targets (D12). The rest follow: dictionary words, then frequent
 * words the dictionary lacks (often names), valid but never targets.
 * @param dictionary Every valid word.
 * @param frequency Frequent words, most frequent first.
 */
export function rankWords(dictionary: readonly string[], frequency: readonly string[]): string[] {
  const valid = new Set(dictionary);
  const common = frequency.filter((word) => valid.has(word));
  const ranked = new Set(common);
  return [
    ...common,
    ...dictionary.filter((word) => !ranked.has(word)),
    ...frequency.filter((word) => !valid.has(word)),
  ];
}

/**
 * Builds a language's word list from its two shipped lists, written with accents.
 * Each word keeps its most frequent spelling.
 */
export function buildWordList(
  dictionary: readonly string[],
  frequency: readonly string[],
  language: Language,
): WordList {
  const spellings = new Map<string, string>();
  for (const written of [...frequency, ...dictionary]) {
    const word = language.normalize(written);
    if (!spellings.has(word)) spellings.set(word, written);
  }
  return {
    words: rankWords(dictionary.map(language.normalize), frequency.map(language.normalize)),
    spellings,
  };
}
