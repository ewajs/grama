/**
 * How hard a level is: the score from its targets' rarity and length, the tiers it falls
 * in, and each tier's recipe for the generator. Calibration in D16.
 * @module
 */

/** How hard a level is, from its target words. */
export type Tier = 'easy' | 'medium' | 'hard' | 'extra';

/** Tiers from easiest to hardest. */
export const TIERS: readonly Tier[] = ['easy', 'medium', 'hard', 'extra'];

/**
 * How the generator builds each tier: targets come from the `pool` most common words,
 * the most common first or the longest first. Calibrated on generated levels (D16) so
 * each recipe mostly lands in its tier.
 */
export const RECIPES: Readonly<Record<Tier, { pool: number; longFirst: boolean }>> = {
  easy: { pool: 1500, longFirst: false },
  medium: { pool: 3000, longFirst: true },
  hard: { pool: 8000, longFirst: true },
  extra: { pool: 20000, longFirst: true },
};

/** The score at which each tier begins; below the first, a level is easy (D16). */
export const TIER_STARTS: Readonly<Record<Exclude<Tier, 'easy'>, number>> = {
  medium: 2.75,
  hard: 3.25,
  extra: 3.75,
};

/** How much each letter beyond 3 adds to a word's difficulty. */
const LENGTH_WEIGHT = 0.25;

/**
 * How hard a level's targets are to find: on average, how rare they are (orders of
 * magnitude of their rank) and how long. Bigger wheels make long words natural, so each
 * letter beyond 6 takes a little off.
 * @param targets Each target's length and rank (0 is the most common word).
 * @param letters Letters on the wheel.
 */
export function levelScore(
  targets: readonly { length: number; rank: number }[],
  letters: number,
): number {
  const total = targets.reduce(
    (sum, { length, rank }) => sum + Math.log10(rank + 1) + LENGTH_WEIGHT * (length - 3),
    0,
  );
  return total / targets.length - LENGTH_WEIGHT * (letters - 6);
}

/** The tier a level score falls in. */
export function classify(score: number): Tier {
  if (score >= TIER_STARTS.extra) return 'extra';
  if (score >= TIER_STARTS.hard) return 'hard';
  if (score >= TIER_STARTS.medium) return 'medium';
  return 'easy';
}
