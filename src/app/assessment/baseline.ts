import { eligibilityOf } from '../../core/assessment/attempt';
import type { BaselineSample } from '../../core/assessment/baseline';
import { bonusWords, hintsUsed, isComplete } from '../../core/session';
import { evidenceJson, isFinalized } from '../../storage/assessment-record';
import { GRAMA_RULES } from './grama';
import { isGramaPayload, isGramaResult } from './payload';
import { isPuzzlePayload } from './puzzle';
import { trialResult } from './trial';

const DIFFICULTY_BAND = 0.25;

/** Projects strict eligible evidence by default; beta explicitly permits unknown exposure, never repeats or uncertain time. */
export function baselineSample(
  record: unknown,
  mode: 'strict' | 'beta' = 'strict',
): BaselineSample | null {
  if (
    !isFinalized(record, isGramaPayload, isGramaResult) ||
    record.attempt.status !== 'completed' ||
    record.attempt.timing !== 'reliable' ||
    !record.payload.presented ||
    record.attempt.activeMs <= 0
  )
    return null;
  const { payload, attempt } = record;
  const eligibility = eligibilityOf(attempt);
  if (!eligibility.eligible && !(mode === 'beta' && eligibility.reason === 'unknown-exposure'))
    return null;
  if (attempt.game !== 'grama') return null;
  const context = {
    model: mode === 'beta' ? 'grama-baseline-beta:1' : 'grama-baseline:1',
    track: attempt.track,
    mode: attempt.mode,
    rules: attempt.rulesVersion,
    content: attempt.contentVersion,
    payload: payload.version,
  };
  let cohort: string, value: number, keys: readonly string[];
  if (isPuzzlePayload(payload)) {
    const { descriptor, session, level } = payload;
    if (
      payload.replay ||
      attempt.track !== 'word-solving' ||
      attempt.mode !== payload.place.kind ||
      attempt.rulesVersion !== GRAMA_RULES.puzzle ||
      descriptor.score === null ||
      !isComplete(level, session) ||
      evidenceJson(attempt.result) !==
        evidenceJson({ kind: 'puzzle', found: session.found, revealed: session.revealed })
    )
      return null;
    cohort = JSON.stringify({
      ...context,
      descriptor: descriptor.version,
      tier: descriptor.tier,
      wheelSize: descriptor.wheelSize,
      targets: descriptor.targetCount,
      difficultyBand: Math.floor(descriptor.score / DIFFICULTY_BAND),
      hints: hintsUsed(session),
      bonus: bonusWords(level, session).length,
    });
    value = -attempt.activeMs;
    keys = [descriptor.exposureKey];
  } else {
    if (
      attempt.track !== 'time-trial' ||
      attempt.mode !== 'trial' ||
      attempt.rulesVersion !== GRAMA_RULES.trial ||
      payload.timeLeft !== 0 ||
      evidenceJson(attempt.result) !== evidenceJson(trialResult(payload))
    )
      return null;
    cohort = JSON.stringify(context);
    value = payload.points;
    keys = payload.wheels.map((wheel) => wheel.descriptor.exposureKey);
  }
  if (
    attempt.exposures.length !== keys.length ||
    attempt.exposures.some((exposure, index) => exposure.key !== keys[index])
  )
    return null;
  return { id: attempt.id, sequence: attempt.sequence, cohort, value };
}
