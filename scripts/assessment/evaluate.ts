import { compareBaselines, BASELINE_WINDOW } from '../../src/core/assessment/baseline.ts';
import {
  inflateRating,
  NEW_RATING,
  ratePeriod,
  type Rating,
} from '../../src/core/assessment/glicko2.ts';
import { seededRandom } from '../../src/core/random.ts';

const PROTOCOL = {
  attempts: 60,
  ghosts: 20,
  skill: 1500,
  change: 200,
  noise: 200,
  easy: 900,
  idle: 90,
};
const DEFAULT_SEEDS = 128;
const CASES = [
  'stable',
  'improvement',
  'decline',
  'perfect-easy',
  'missing',
  'cohort-shift',
  'duplicate',
  'inactivity',
] as const;
const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
const rounded = (values: number[]) => (values.length ? Number(mean(values).toFixed(4)) : null);

/** Reproducible synthetic comparisons; these assumptions do not calibrate real Grama evidence. */
export function evaluate(seedCount = DEFAULT_SEEDS, firstSeed = 0) {
  if (
    !Number.isSafeInteger(seedCount) ||
    seedCount < 1 ||
    !Number.isSafeInteger(firstSeed) ||
    firstSeed < 0 ||
    firstSeed + seedCount > 2 ** 32
  )
    throw new RangeError('Invalid seed count');
  return CASES.map((scenario) => {
    const comparisons = new Map<string, number[]>(),
      drifts: number[] = [],
      deviations: number[] = [],
      ghostDeviations: number[] = [],
      firstDeviations: number[] = [],
      ghostFirstDeviations: number[] = [],
      idleGains: number[] = [];
    let observations = 0,
      ghostFailures = 0;
    for (let seed = firstSeed; seed < firstSeed + seedCount; seed++) {
      const random = seededRandom(seed);
      let samples = Array.from({ length: PROTOCOL.attempts }, (_, index) => {
        const u = Math.max(Number.EPSILON, Math.min(1 - Number.EPSILON, random()));
        const noise = PROTOCOL.noise * Math.log(u / (1 - u));
        const change =
          index < BASELINE_WINDOW
            ? 0
            : scenario === 'improvement'
              ? PROTOCOL.change
              : scenario === 'decline'
                ? -PROTOCOL.change
                : 0;
        const easy =
          scenario === 'perfect-easy' ||
          (scenario === 'cohort-shift' && index >= PROTOCOL.attempts / 2);
        const challenge = easy ? PROTOCOL.easy : PROTOCOL.skill;
        return {
          id: String(index + 1),
          sequence: index + 1,
          cohort: easy ? 'easy' : 'standard',
          value: scenario === 'perfect-easy' ? 1 : PROTOCOL.skill + change - challenge + noise,
          challenge,
        };
      });
      if (scenario === 'missing') samples = samples.filter((sample) => sample.sequence % 3 !== 0);
      if (scenario === 'duplicate')
        samples = samples.flatMap((sample) =>
          Array.from({ length: PROTOCOL.ghosts }, () => ({ ...sample })),
        );
      for (const report of compareBaselines(samples)) {
        if (report.comparison === null) continue;
        const scores = comparisons.get(report.cohort) ?? [];
        scores.push(report.comparison);
        comparisons.set(report.cohort, scores);
      }
      const distinct = [...new Map(samples.map((sample) => [sample.id, sample])).values()];
      observations = distinct.length;
      let rating = { ...NEW_RATING },
        reference = NEW_RATING.rating;
      let ghosts: Rating | null = { ...NEW_RATING };
      for (const [index, sample] of distinct.entries()) {
        const result = {
          opponent: { rating: sample.challenge, deviation: 30 },
          score: sample.value > 0 ? (1 as const) : (0 as const),
        };
        rating = ratePeriod(rating, [result]);
        if (index === BASELINE_WINDOW - 1) reference = rating.rating;
        if (scenario === 'duplicate' && ghosts) {
          try {
            ghosts = ratePeriod(
              ghosts,
              Array.from({ length: PROTOCOL.ghosts }, () => result),
            );
            if (index === 0) {
              firstDeviations.push(rating.deviation);
              ghostFirstDeviations.push(ghosts.deviation);
            }
          } catch (error) {
            if (!(error instanceof RangeError)) throw error;
            ghosts = null;
            ghostFailures++;
          }
        }
      }
      const idle = scenario === 'inactivity' ? inflateRating(rating, PROTOCOL.idle) : rating;
      drifts.push(idle.rating - reference);
      deviations.push(idle.deviation);
      if (scenario === 'duplicate' && ghosts) ghostDeviations.push(ghosts.deviation);
      if (scenario === 'inactivity') idleGains.push(idle.deviation - rating.deviation);
    }
    return {
      scenario,
      observations,
      comparisons: Object.fromEntries(
        [...comparisons].map(([key, values]) => [key, rounded(values)]),
      ),
      ratingDrift: rounded(drifts),
      deviation: rounded(deviations),
      ...(scenario === 'duplicate'
        ? {
            naiveGhostFailures: ghostFailures,
            naiveGhostDeviation: ghostFailures ? null : rounded(ghostDeviations),
            singleFirstDeviation: rounded(firstDeviations),
            naiveFirstDeviation: rounded(ghostFirstDeviations),
          }
        : {}),
      ...(idleGains.length ? { idleDeviationGain: rounded(idleGains) } : {}),
    };
  });
}

if (import.meta.main) {
  const seeds = Number(process.argv[2] ?? DEFAULT_SEEDS),
    firstSeed = Number(process.argv[3] ?? 0);
  console.log(
    JSON.stringify(
      {
        version: 1,
        seeds,
        firstSeed,
        protocol: { ...PROTOCOL, window: BASELINE_WINDOW },
        cases: evaluate(seeds, firstSeed),
      },
      null,
      2,
    ),
  );
}
