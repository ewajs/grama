/**
 * Results of completed levels: stars, and keeping the best of every play per level.
 * @module
 */

import type { Difficulty } from './cadence';
import type { Tier } from './difficulty';
import type { Level } from './level';
import { bonusWords, hintsUsed, type Session } from './session';

/** Stars earned on a level, from 1 to 3. */
export type Stars = 1 | 2 | 3;

/** Bonus words needed, with no hints, for three stars. */
export const THREE_STAR_BONUS = 3;

/** How a completed level went: what the map, stats and achievements read. */
export type LevelRecord = {
  /** How hard the level was. */
  tier: Tier;
  /** The player's difficulty when it was played: with the number, it decides the tier. */
  difficulty: Difficulty;
  /** Its place in its tier's seed order: with the rest, it regenerates the level. */
  occurrence: number;
  /** Stars earned: see {@link starsFor}. */
  stars: Stars;
  /** Hints spent on it. */
  hints: number;
  /** Bonus words found on it. */
  bonus: number;
  /** Targets it had. */
  targets: number;
};

/** Completed levels by number: the player's best on each. */
export type History = Readonly<Record<number, LevelRecord>>;

/** What a play lacks for three stars: nothing when both are 0. */
export type MissingStars = {
  /** Hints spent, where three stars allow none. */
  hints: number;
  /** Bonus words still to find. */
  bonus: number;
};

/** What a play of `level` lacks for three stars, so far. */
export function missingForThreeStars(level: Level, session: Session): MissingStars {
  return {
    hints: hintsUsed(session),
    bonus: Math.max(0, THREE_STAR_BONUS - bonusWords(level, session).length),
  };
}

/**
 * Stars for a completed level: ★★★ with no hints and at least {@link THREE_STAR_BONUS}
 * bonus words, ★★ with at most one hint, ★ otherwise.
 */
export function starsFor(level: Level, session: Session): Stars {
  const { hints, bonus } = missingForThreeStars(level, session);
  if (hints === 0 && bonus === 0) return 3;
  return hints <= 1 ? 2 : 1;
}

/** The record of a completed level, played at `difficulty` from its seed `occurrence`. */
export function recordOf(
  level: Level,
  session: Session,
  difficulty: Difficulty,
  occurrence: number,
): LevelRecord {
  return {
    tier: level.tier,
    difficulty,
    occurrence,
    stars: starsFor(level, session),
    hints: hintsUsed(session),
    bonus: bonusWords(level, session).length,
    targets: level.targets.length,
  };
}

/**
 * Results with a level's new one merged in: the most stars, the fewest hints and the most
 * bonus words of every play, so nothing counted from them ever goes down. Works for
 * numbered levels and for daily challenges (keyed by date).
 * @returns The same results when the new one improves nothing.
 */
export function record<Key extends string | number>(
  results: Readonly<Record<Key, LevelRecord>>,
  key: Key,
  result: LevelRecord,
): Readonly<Record<Key, LevelRecord>> {
  const best: LevelRecord | undefined = results[key];
  if (!best) return { ...results, [key]: result };
  if (result.stars <= best.stars && result.hints >= best.hints && result.bonus <= best.bonus) {
    return results;
  }
  const merged: LevelRecord = {
    ...best,
    stars: Math.max(result.stars, best.stars) as Stars,
    hints: Math.min(result.hints, best.hints),
    bonus: Math.max(result.bonus, best.bonus),
  };
  return { ...results, [key]: merged };
}
