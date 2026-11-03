import { NEW_RATING, type Rating, type RatingResult } from './glicko2';

/** Versioned benchmark assumptions; changing scoring, admission or trend bumps the version. */
export const PERFORMANCE = {
  version: 2,
  referenceDifficulty: 3,
  difficultyWeight: 400,
  opponentDeviation: 150,
  completion: 0.65,
  hintPenalty: 0.15,
  assistedFraction: 0.2,
  bonusLimit: 0.05,
  bonusHalf: 3,
  timeLimit: 0.05,
  secondsPerLetter: 4,
  paceDifficulty: 2.75,
  trendWindow: 3,
  trendThreshold: 15,
} as const;

/** Original completed-puzzle features; null duration gives a neutral speed adjustment. */
export type PerformanceInput = {
  difficulty: number;
  targetLetters: number;
  revealedLetters: number;
  bonusWords: number;
  activeMs: number | null;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const mean = (values: readonly Rating[]) =>
  values.reduce((sum, value) => sum + value.rating, 0) / values.length;

/** Builds one fractional Glicko result: difficulty sets the opponent, other factors adjust the outcome. */
export function performanceMatch(input: PerformanceInput): RatingResult {
  const { difficulty, targetLetters, revealedLetters, bonusWords, activeMs } = input;
  if (
    !Number.isFinite(difficulty) ||
    !Number.isSafeInteger(targetLetters) ||
    targetLetters <= 0 ||
    !Number.isSafeInteger(revealedLetters) ||
    revealedLetters < 0 ||
    revealedLetters > targetLetters ||
    !Number.isSafeInteger(bonusWords) ||
    bonusWords < 0 ||
    (activeMs !== null && (!Number.isFinite(activeMs) || activeMs <= 0))
  )
    throw new RangeError('Invalid performance input');
  const p = PERFORMANCE,
    rating = NEW_RATING.rating + p.difficultyWeight * (difficulty - p.referenceDifficulty),
    hints = p.hintPenalty * Math.min(1, revealedLetters / targetLetters / p.assistedFraction),
    bonus = p.bonusLimit * (bonusWords / (bonusWords + p.bonusHalf)),
    // Work in log space to avoid exponentiating difficulty for the assumed pace.
    time =
      activeMs === null
        ? 0
        : p.timeLimit *
          clamp(
            Math.log2((targetLetters * p.secondsPerLetter * 1000) / activeMs) +
              difficulty -
              p.paceDifficulty,
            -1,
            1,
          );
  if (!Number.isFinite(rating))
    throw new RangeError('Performance opponent exceeds numerical range');
  return {
    opponent: { rating, deviation: p.opponentDeviation },
    score: p.completion - hints + bonus + time,
  };
}

/** Current Glicko state plus a small trend over two disjoint three-update windows. */
export function summarizePerformance(ratings: readonly Rating[]): {
  current: Rating | null;
  trend: 'up' | 'steady' | 'down' | null;
} {
  const p = PERFORMANCE,
    current = ratings.at(-1) ?? null;
  if (ratings.length < p.trendWindow * 2) return { current, trend: null };
  const difference =
    mean(ratings.slice(-p.trendWindow)) - mean(ratings.slice(-p.trendWindow * 2, -p.trendWindow));
  return {
    current,
    trend:
      difference >= p.trendThreshold ? 'up' : difference <= -p.trendThreshold ? 'down' : 'steady',
  };
}
