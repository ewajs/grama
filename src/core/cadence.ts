/**
 * Which tier each level gets: the 7-level rhythm, adjusted for progress and the player's
 * difficulty setting, and each level's place in its tier's seed order.
 * @module
 */

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
 * How many levels of each tier and size came before the current one, keyed like
 * `"easy:6"`: where the next level of each kind starts in its tier's seed order. Counting
 * the levels actually played (not recounting them at today's difficulty) means a change
 * of difficulty never sends the player back to seeds they already used.
 */
export type Occurrences = Readonly<Record<string, number>>;

function kindOf(levelNumber: number, tier: Tier): string {
  return `${tier}:${levelShape(levelNumber).letters}`;
}

/** Level `levelNumber`'s place in its tier's seed order, after the levels counted. */
export function occurrenceIn(counted: Occurrences, levelNumber: number, tier: Tier): number {
  return counted[kindOf(levelNumber, tier)] ?? 0;
}

/** The counts with level `levelNumber`, of `tier`, added. */
export function countLevel(counted: Occurrences, levelNumber: number, tier: Tier): Occurrences {
  const kind = kindOf(levelNumber, tier);
  return { ...counted, [kind]: (counted[kind] ?? 0) + 1 };
}

/** The counts for levels 1 to `levelNumber − 1`, all played at one difficulty. */
export function occurrencesBefore(levelNumber: number, difficulty: Difficulty): Occurrences {
  let counted: Occurrences = {};
  for (let earlier = 1; earlier < levelNumber; earlier++) {
    counted = countLevel(counted, earlier, tierFor(earlier, difficulty));
  }
  return counted;
}

/**
 * Level `levelNumber`'s place in its tier's seed order when every level before it was
 * played at `difficulty` (see `generateLevel`): what `?nivel=N` and tests use.
 */
export function occurrence(levelNumber: number, difficulty: Difficulty): number {
  return occurrenceIn(
    occurrencesBefore(levelNumber, difficulty),
    levelNumber,
    tierFor(levelNumber, difficulty),
  );
}
