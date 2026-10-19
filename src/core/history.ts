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
  tier: Tier;
  /** The player's difficulty when it was played: with the number, it regenerates the level. */
  difficulty: Difficulty;
  stars: Stars;
  /** Hints spent on it. */
  hints: number;
  /** Bonus words found on it. */
  bonus: number;
  /** Targets it had. */
  targets: number;
};

/** Completed levels by number: the player's best result on each. */
export type History = Readonly<Record<number, LevelRecord>>;

/**
 * Stars for a completed level: ★★★ with no hints and at least {@link THREE_STAR_BONUS}
 * bonus words, ★★ with at most one hint, ★ otherwise.
 */
export function starsFor(level: Level, session: Session): Stars {
  const hints = hintsUsed(session);
  if (hints === 0 && bonusWords(level, session).length >= THREE_STAR_BONUS) return 3;
  return hints <= 1 ? 2 : 1;
}

/** The record of a completed level, played at `difficulty`. */
export function recordOf(level: Level, session: Session, difficulty: Difficulty): LevelRecord {
  return {
    tier: level.tier,
    difficulty,
    stars: starsFor(level, session),
    hints: hintsUsed(session),
    bonus: bonusWords(level, session).length,
    targets: level.targets.length,
  };
}

/** Whether `record` beats `best`: more stars, or as many with fewer hints or more bonus. */
function beats(record: LevelRecord, best: LevelRecord): boolean {
  if (record.stars !== best.stars) return record.stars > best.stars;
  if (record.hints !== best.hints) return record.hints < best.hints;
  return record.bonus > best.bonus;
}

/**
 * Results with a level's new one, kept only if it's the best so far. Works for numbered
 * levels and for daily challenges (keyed by date).
 * @returns The same results when the new one doesn't beat the old one.
 */
export function record<Key extends string | number>(
  results: Readonly<Record<Key, LevelRecord>>,
  key: Key,
  result: LevelRecord,
): Readonly<Record<Key, LevelRecord>> {
  const best: LevelRecord | undefined = results[key];
  return best && !beats(result, best) ? results : { ...results, [key]: result };
}
