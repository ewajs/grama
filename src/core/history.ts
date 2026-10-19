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

/** The record of a completed level. */
export function recordOf(level: Level, session: Session): LevelRecord {
  return {
    tier: level.tier,
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
 * The history with a level's new result, kept only if it's the best so far.
 * @returns The same history when the new result doesn't beat the old one.
 */
export function record(history: History, levelNumber: number, result: LevelRecord): History {
  const best = history[levelNumber];
  return best && !beats(result, best) ? history : { ...history, [levelNumber]: result };
}
