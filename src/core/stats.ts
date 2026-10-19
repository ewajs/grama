import { TIERS, type Tier } from './difficulty';
import type { History } from './history';

/** The player's totals, from their history of completed levels (best result each). */
export type Stats = {
  /** Levels completed. */
  levels: number;
  /** Levels completed, by tier. */
  byTier: Readonly<Record<Tier, number>>;
  /** Stars earned. */
  stars: number;
  /** Levels with three stars. */
  threeStars: number;
  /** Target words found. */
  words: number;
  /** Bonus words found. */
  bonus: number;
  /** Hints spent. */
  hints: number;
  /** Levels completed without hints. */
  noHints: number;
  /** Extra-hard levels completed without hints. */
  extraNoHints: number;
};

/** Totals over every completed level's best result. */
export function statsOf(history: History): Stats {
  const results = Object.values(history);
  const count = (keep: (result: (typeof results)[number]) => boolean) =>
    results.filter(keep).length;
  const sum = (value: (result: (typeof results)[number]) => number) =>
    results.reduce((total, result) => total + value(result), 0);
  return {
    levels: results.length,
    byTier: Object.fromEntries(
      TIERS.map((tier) => [tier, count((result) => result.tier === tier)]),
    ) as Record<Tier, number>,
    stars: sum((result) => result.stars),
    threeStars: count((result) => result.stars === 3),
    words: sum((result) => result.targets),
    bonus: sum((result) => result.bonus),
    hints: sum((result) => result.hints),
    noHints: count((result) => result.hints === 0),
    extraNoHints: count((result) => result.tier === 'extra' && result.hints === 0),
  };
}
