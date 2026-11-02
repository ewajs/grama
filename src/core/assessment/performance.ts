/** Provisional performance policy; changing any scoring or summary rule bumps its version. */
export const PERFORMANCE = {
  version: 1,
  base: 20,
  difficultyWeight: 15,
  maxDifficulty: 5,
  hintPenalty: 50,
  timeLimit: 3,
  secondsPerLetter: 4,
  referenceDifficulty: 2.75,
  recentWindow: 5,
  trendWindow: 3,
  trendThreshold: 3,
} as const;

/** Original puzzle features; null duration means the time adjustment is unavailable. */
export type PerformanceInput = {
  difficulty: number;
  targetLetters: number;
  revealedLetters: number;
  activeMs: number | null;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const mean = (values: readonly number[]) => values.reduce((sum, n) => sum + n, 0) / values.length;

/** Difficulty and independence dominate a 0–100 score; time contributes at most ±3 points. */
export function performanceScore(input: PerformanceInput): number {
  const { difficulty, targetLetters, revealedLetters, activeMs } = input;
  if (
    !Number.isFinite(difficulty) ||
    !Number.isSafeInteger(targetLetters) ||
    targetLetters <= 0 ||
    !Number.isSafeInteger(revealedLetters) ||
    revealedLetters < 0 ||
    revealedLetters > targetLetters ||
    (activeMs !== null && (!Number.isFinite(activeMs) || activeMs <= 0))
  )
    throw new RangeError('Invalid performance input');
  const p = PERFORMANCE,
    d = clamp(difficulty, 0, p.maxDifficulty),
    referenceMs = targetLetters * p.secondsPerLetter * 1000 * 2 ** (d - p.referenceDifficulty),
    time = activeMs === null ? 0 : p.timeLimit * clamp(Math.log2(referenceMs / activeMs), -1, 1);
  return clamp(
    p.base + p.difficultyWeight * d - p.hintPenalty * (revealedLetters / targetLetters) + time,
    0,
    100,
  );
}

/** Summarizes chronological scored completions, without rounding or waiting for a full window. */
export function summarizePerformance(scores: readonly number[]): {
  current: number | null;
  trend: 'up' | 'steady' | 'down' | null;
} {
  if (scores.some((score) => !Number.isFinite(score) || score < 0 || score > 100))
    throw new RangeError('Invalid performance score');
  const p = PERFORMANCE,
    current = scores.length ? mean(scores.slice(-p.recentWindow)) : null;
  if (scores.length < p.trendWindow * 2) return { current, trend: null };
  const difference =
    mean(scores.slice(-p.trendWindow)) - mean(scores.slice(-p.trendWindow * 2, -p.trendWindow));
  return {
    current,
    trend:
      difference >= p.trendThreshold ? 'up' : difference <= -p.trendThreshold ? 'down' : 'steady',
  };
}
