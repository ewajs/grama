/**
 * The player's totals, for the stats screen and achievements. They only ever grow.
 * @module
 */

import { TIERS, type Tier } from './difficulty';
import { streakOf } from './daily';
import type { Progress } from './progress';

/**
 * The player's totals. Except for `levels` and `dailies`, they count numbered levels and
 * daily challenges alike, each by its best (see `record`).
 */
export type Stats = {
  /** Numbered levels completed. */
  levels: number;
  /** Levels and dailies completed, by tier. */
  byTier: Readonly<Record<Tier, number>>;
  /** Stars earned. */
  stars: number;
  /** Levels with three stars. */
  threeStars: number;
  /** Target words found. */
  words: number;
  /** Bonus words found. */
  bonus: number;
  /** Hints spent, ever. */
  hints: number;
  /** Levels completed without hints. */
  noHints: number;
  /** Extra-hard levels completed without hints. */
  extraNoHints: number;
  /** Daily challenges completed. */
  dailies: number;
  /** The longest daily streak (streak freezes included, see `streakOf`). */
  bestStreak: number;
};

/** The player's totals, from their completed levels and dailies and the hints they spent. */
export function statsOf({
  history,
  dailies,
  hintsSpent,
}: Pick<Progress, 'history' | 'dailies' | 'hintsSpent'>): Stats {
  const results = [...Object.values(history), ...Object.values(dailies)];
  const count = (keep: (result: (typeof results)[number]) => boolean) =>
    results.filter(keep).length;
  const sum = (value: (result: (typeof results)[number]) => number) =>
    results.reduce((total, result) => total + value(result), 0);
  return {
    levels: Object.keys(history).length,
    byTier: Object.fromEntries(
      TIERS.map((tier) => [tier, count((result) => result.tier === tier)]),
    ) as Record<Tier, number>,
    stars: sum((result) => result.stars),
    threeStars: count((result) => result.stars === 3),
    words: sum((result) => result.targets),
    bonus: sum((result) => result.bonus),
    hints: hintsSpent,
    noHints: count((result) => result.hints === 0),
    extraNoHints: count((result) => result.tier === 'extra' && result.hints === 0),
    dailies: Object.keys(dailies).length,
    bestStreak: streakOf(dailies, Object.keys(dailies).sort().at(-1) ?? '').best,
  };
}
