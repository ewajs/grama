/**
 * Turning the shipped word lists into what the game uses: every valid word ranked by
 * how common it is, and how each word is written. See the Words guide.
 * @module
 */

import type { Language } from '../core/language';

/** A language's words, ready to play with. */
export type WordList = {
  /** Every valid word as the game compares them, most common first: `generateLevel`'s input. */
  words: string[];
  /** How each word is written, accents included: `TENES` → `TENÉS`. */
  spellings: ReadonlyMap<string, string>;
};

/** A language's shipped lists, words written with accents (see D12, D14). */
export type SourceLists = {
  /** Every valid word, from the dictionary. */
  dictionary: readonly string[];
  /** Frequent words, most frequent first; only ranks words, doesn't make them valid. */
  frequency: readonly string[];
  /** Hand-picked everyday words: always valid, and common enough to be targets. */
  curated: readonly string[];
};

/** The lowest rank a curated word can get: well within the words that can be targets. */
export const CURATED_RANK = 2500;

/**
 * The words of a shipped word-list file: one per line; `#` lines are comments, like the
 * license header.
 */
export function parseWordList(text: string): string[] {
  return text.split('\n').filter((line) => line !== '' && !line.startsWith('#'));
}

/**
 * Every valid word, most common first. Valid words that are frequent lead, in frequency
 * order: they're the ones common enough to be targets. Curated words rank no lower than
 * {@link CURATED_RANK}. The rest of the dictionary follows.
 */
export function rankWords({ dictionary, frequency, curated }: SourceLists): string[] {
  const valid = new Set([...dictionary, ...curated]);
  const common = frequency.filter((word) => valid.has(word));
  const late = new Set(
    curated.filter((word) => {
      const rank = common.indexOf(word);
      return rank === -1 || rank > CURATED_RANK;
    }),
  );
  const ranked = common.filter((word) => !late.has(word));
  ranked.splice(CURATED_RANK, 0, ...late);
  const placed = new Set(ranked);
  return [...ranked, ...dictionary.filter((word) => !placed.has(word))];
}

/**
 * Builds a language's word list from its shipped lists. Each word keeps its most
 * frequent spelling.
 */
export function buildWordList(lists: SourceLists, language: Language): WordList {
  const spellings = new Map<string, string>();
  for (const written of [...lists.frequency, ...lists.curated, ...lists.dictionary]) {
    const word = language.normalize(written);
    if (!spellings.has(word)) spellings.set(word, written);
  }
  return {
    words: rankWords({
      dictionary: lists.dictionary.map(language.normalize),
      frequency: lists.frequency.map(language.normalize),
      curated: lists.curated.map(language.normalize),
    }),
    spellings,
  };
}
