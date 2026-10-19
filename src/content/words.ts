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
  /** How words are written when it's not as compared, accents included: `TENES` → `TENÉS`. */
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
 * frequent spelling. Every word is normalized once, and only words written differently
 * (with an accent) get an entry in `spellings`: on a phone this runs before the first
 * level, so it's kept lean.
 */
export function buildWordList(lists: SourceLists, language: Language): WordList {
  const dictionary = lists.dictionary.map(language.normalize);
  const frequency = lists.frequency.map(language.normalize);
  const curated = lists.curated.map(language.normalize);
  const words = rankWords({ dictionary, frequency, curated });

  // First spelling wins: the frequency list's, then the curated list's, then the
  // dictionary's. Each list has a word once, so only earlier lists need checking.
  const spellings = new Map<string, string>();
  const earlier = new Set<string>();
  for (const [written, normalized] of [
    [lists.frequency, frequency],
    [lists.curated, curated],
    [lists.dictionary, dictionary],
  ] as const) {
    for (const [index, word] of normalized.entries()) {
      if (earlier.has(word)) continue;
      const spelling = written[index] ?? word;
      if (spelling !== word) spellings.set(word, spelling);
    }
    if (normalized !== dictionary) for (const word of normalized) earlier.add(word);
  }
  return { words, spellings };
}
