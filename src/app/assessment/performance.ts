import {
  PERFORMANCE,
  performanceMatch,
  summarizePerformance,
} from '../../core/assessment/performance';
import {
  NEW_RATING,
  ratePeriod,
  type Rating,
  type RatingResult,
} from '../../core/assessment/glicko2';
import { bonusWords, hintsUsed, isComplete } from '../../core/session';
import { evidenceJson, isFinalized } from '../../storage/assessment-record';
import { GRAMA_RULES } from './grama';
import { isGramaPayload, isGramaResult, type GramaRecord } from './payload';
import { trialResult } from './trial';

/** Recomputes personal performance from original records; never changes research eligibility or saves. */
export function performanceHistory(records: readonly unknown[]) {
  const unique = new Map<string, GramaRecord>(),
    sequences = new Map<number, string>();
  for (const record of records) {
    if (!isFinalized(record, isGramaPayload, isGramaResult) || record.attempt.game !== 'grama')
      continue;
    const { id, sequence } = record.attempt,
      previous = unique.get(id),
      owner = sequences.get(sequence);
    if (
      (previous && evidenceJson(previous) !== evidenceJson(record)) ||
      (owner !== undefined && owner !== id)
    )
      throw new RangeError('Conflicting performance history');
    unique.set(id, record);
    sequences.set(sequence, id);
  }
  const puzzles: { record: GramaRecord; match: RatingResult | null; rating: Rating | null }[] = [],
    trials: GramaRecord[] = [],
    ratings: Rating[] = [];
  let player: Readonly<Rating> = NEW_RATING;
  let trialBest: number | null = null;
  for (const record of [...unique.values()].sort(
    (a, b) => a.attempt.sequence - b.attempt.sequence,
  )) {
    const { attempt, payload } = record;
    if (attempt.status !== 'completed' || !payload.presented) continue;
    if ('place' in payload) {
      if (
        attempt.track !== 'word-solving' ||
        attempt.mode !== payload.place.kind ||
        attempt.rulesVersion !== GRAMA_RULES.puzzle ||
        !isComplete(payload.level, payload.session) ||
        evidenceJson(attempt.result) !==
          evidenceJson({
            kind: 'puzzle',
            found: payload.session.found,
            revealed: payload.session.revealed,
          }) ||
        attempt.exposures.length !== 1 ||
        attempt.exposures[0]?.key !== payload.descriptor.exposureKey
      )
        continue;
      const practice =
        payload.replay || attempt.exposures.some((exposure) => exposure.kind === 'repeat');
      const match =
        practice || payload.descriptor.score === null
          ? null
          : performanceMatch({
              difficulty: payload.descriptor.score,
              targetLetters: payload.descriptor.targets.reduce(
                (sum, target) => sum + target.length,
                0,
              ),
              revealedLetters: hintsUsed(payload.session),
              bonusWords: bonusWords(payload.level, payload.session).length,
              activeMs:
                attempt.timing === 'reliable' && attempt.activeMs > 0 ? attempt.activeMs : null,
            });
      const rating = match === null ? null : ratePeriod(player, [match]);
      puzzles.push({ record, match, rating });
      if (rating !== null) {
        player = rating;
        ratings.push(rating);
      }
    } else {
      if (
        attempt.track !== 'time-trial' ||
        attempt.mode !== 'trial' ||
        attempt.rulesVersion !== GRAMA_RULES.trial ||
        payload.timeLeft !== 0 ||
        evidenceJson(attempt.result) !== evidenceJson(trialResult(payload)) ||
        attempt.exposures.length !== payload.wheels.length ||
        attempt.exposures.some(
          (exposure, index) => exposure.key !== payload.wheels[index]?.descriptor.exposureKey,
        )
      )
        continue;
      trials.push(record);
      trialBest = Math.max(trialBest ?? 0, payload.points);
    }
  }
  return {
    version: PERFORMANCE.version,
    puzzles,
    ...summarizePerformance(ratings),
    trials,
    trialBest,
  };
}

/** Visible rating after a particular attempt; null change marks the first rated puzzle. */
export type RatingUpdate = { rating: number; change: number | null };

/** Finds the matching update and reconciles its delta with displayed rounded before/after ratings. */
export function ratingUpdate(
  history: ReturnType<typeof performanceHistory>,
  id: string,
): RatingUpdate | null {
  let before: number | null = null;
  for (const entry of history.puzzles) {
    if (!entry.rating) continue;
    if (entry.record.attempt.id === id)
      return {
        rating: entry.rating.rating,
        change: before === null ? null : Math.round(entry.rating.rating) - Math.round(before),
      };
    before = entry.rating.rating;
  }
  return null;
}
