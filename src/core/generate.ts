import { canSpell, MIN_WORD_LENGTH, type Level } from './level';
import { seededRandom, shuffled } from './random';

/** How big a level is: letters on the wheel and the most targets on the board. */
export type LevelShape = { letters: number; targets: number };

/** The size of every level, for now. It will grow with the level number. */
export const LEVEL_SHAPE: LevelShape = { letters: 6, targets: 8 };

/** Fewest targets a generated level may have; fewer would make a dull board. */
export const MIN_TARGETS = 4;

/** How many of the most common words may be targets; rarer ones are only bonus words. */
export const COMMON_WORDS = 5000;

/**
 * Builds level `levelNumber` from a word list. The same number and list always give the
 * same level. The letters come from a common word; every word they spell is valid, and
 * the most common ones (that word included) are the targets.
 * @param words Normalized words, most common first, no repeats.
 * @param commonWords How many words from the top of the list may be targets.
 */
export function generateLevel(
  words: readonly string[],
  levelNumber: number,
  commonWords = COMMON_WORDS,
): Level {
  const random = seededRandom(levelNumber);
  const seeds = words.slice(0, commonWords).filter((word) => word.length === LEVEL_SHAPE.letters);

  // Seeds are tried in a random order until one spells enough common words.
  for (const seed of shuffled(seeds, random)) {
    const letters = shuffled([...seed], random);
    // A word's position in the list is its rank: lower means more common.
    const spelled = words
      .map((word, rank) => ({ word, rank }))
      .filter(({ word }) => word.length >= MIN_WORD_LENGTH && canSpell(letters, word));
    const common = spelled.filter(({ rank }) => rank < commonWords).map(({ word }) => word);
    if (common.length < MIN_TARGETS) continue;

    const targets = [seed, ...common.filter((word) => word !== seed)].slice(0, LEVEL_SHAPE.targets);
    const bonus = spelled.map(({ word }) => word).filter((word) => !targets.includes(word));
    return { letters, targets, bonus };
  }
  throw new Error(`No ${LEVEL_SHAPE.letters}-letter word makes a level with this word list`);
}
