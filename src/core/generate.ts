import { canSpell, MIN_WORD_LENGTH, type Level } from './level';
import { seededRandom, shuffled } from './random';

/** How big and hard a level is. */
export type LevelShape = {
  /** Letters on the wheel. */
  letters: number;
  /** Most targets on the board. */
  targets: number;
  /** Shortest target word; shorter words can still be bonus words. */
  shortestTarget: number;
};

/** The difficulty curve: each step applies from level `from` on. Tune it here. */
export const DIFFICULTY: readonly (LevelShape & { from: number })[] = [
  { from: 1, letters: 6, targets: 6, shortestTarget: 3 },
  { from: 6, letters: 6, targets: 8, shortestTarget: 3 },
  { from: 16, letters: 7, targets: 10, shortestTarget: 3 },
  { from: 41, letters: 8, targets: 12, shortestTarget: 4 },
];

/** The shape of level `levelNumber`, from the difficulty curve. */
export function levelShape(levelNumber: number): LevelShape {
  const step = DIFFICULTY.findLast(({ from }) => from <= levelNumber) ?? DIFFICULTY[0];
  if (!step) throw new Error('The difficulty curve is empty');
  return step;
}

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
  const shape = levelShape(levelNumber);
  const seeds = words.slice(0, commonWords).filter((word) => word.length === shape.letters);

  // Seeds are tried in a random order until one spells enough common words.
  for (const seed of shuffled(seeds, random)) {
    const letters = shuffled([...seed], random);
    // A word's position in the list is its rank: lower means more common.
    const spelled = words
      .map((word, rank) => ({ word, rank }))
      .filter(({ word }) => word.length >= MIN_WORD_LENGTH && canSpell(letters, word));
    const common = spelled
      .filter(({ word, rank }) => rank < commonWords && word.length >= shape.shortestTarget)
      .map(({ word }) => word);
    if (common.length < MIN_TARGETS) continue;

    const targets = [seed, ...common.filter((word) => word !== seed)].slice(0, shape.targets);
    const bonus = spelled.map(({ word }) => word).filter((word) => !targets.includes(word));
    return { letters, targets, bonus };
  }
  throw new Error(`No ${shape.letters}-letter word makes a level with this word list`);
}
