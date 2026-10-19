import { TIERS, type Tier } from './difficulty';
import { levelShape } from './generate';

/** How hard the player wants the game, from the menu. */
export type Difficulty = 'relaxed' | 'normal' | 'challenging';

/** The rhythm of tiers, repeating every 7 levels: an easy level follows each extra hard. */
export const CYCLE: readonly Tier[] = [
  'easy',
  'medium',
  'medium',
  'hard',
  'easy',
  'medium',
  'extra',
];

/** No extra-hard levels before this one: new players settle in first. */
export const FIRST_EXTRA = 15;

/** From this level on, the cycle's middle easy level becomes medium. */
export const HARDER_FROM = 50;

/**
 * The tier of level `levelNumber`: the cycle's, adjusted for progress and for the
 * player's difficulty (Relajada: one easier, never extra hard; Desafiante: one harder).
 */
export function tierFor(levelNumber: number, difficulty: Difficulty): Tier {
  const position = (levelNumber - 1) % CYCLE.length;
  let tier = CYCLE[position] ?? 'medium';
  if (tier === 'extra' && levelNumber < FIRST_EXTRA) tier = 'hard';
  // Position 0 stays easy: it's the breather after an extra hard.
  if (tier === 'easy' && position !== 0 && levelNumber >= HARDER_FROM) tier = 'medium';

  const shift = { relaxed: -1, normal: 0, challenging: 1 }[difficulty];
  const index = Math.min(Math.max(TIERS.indexOf(tier) + shift, 0), TIERS.length - 1);
  const shifted = TIERS[index] ?? tier;
  return difficulty === 'relaxed' && shifted === 'extra' ? 'hard' : shifted;
}

/**
 * How many levels before `levelNumber` share its tier and size: where it starts in its
 * tier's seed order, so consecutive levels of a kind don't repeat (see `generateLevel`).
 */
export function occurrence(levelNumber: number, difficulty: Difficulty): number {
  const tier = tierFor(levelNumber, difficulty);
  const { letters } = levelShape(levelNumber);
  let count = 0;
  for (let earlier = 1; earlier < levelNumber; earlier++) {
    if (tierFor(earlier, difficulty) === tier && levelShape(earlier).letters === letters) count++;
  }
  return count;
}
