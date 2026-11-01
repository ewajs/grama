import type { Level } from '../../core/level';
import { isComplete, type Session } from '../../core/session';
import type { RunResult } from '../../core/time-trial';
import { evidenceJson } from '../../storage/assessment-record';
import { isCount, isObject } from '../../storage/guards';
import { describePuzzle, type GramaResult } from './grama';
import { isPuzzleSnapshot, type PuzzleSnapshot } from './puzzle';

/** A presented wheel, retained when the run advances or skips it. */
export type TrialWheel = {
  level: Level;
  session: Session;
  outcome: 'current' | 'cleared' | 'skipped';
};

/** Plain trial state copied at semantic interactions, independently of animation frames. */
export type TrialObservation = RunResult & {
  kind: 'trial';
  seed: number;
  timeLeft: number;
  wheels: readonly TrialWheel[];
};

/** Original run evidence; the latest wheel is acknowledged only after its exposure commits. */
export type TrialPayload = Omit<TrialObservation, 'wheels'> & {
  version: 1;
  presented: boolean;
  wheels: readonly (PuzzleSnapshot & Pick<TrialWheel, 'outcome'>)[];
};

/** The trial branch of Grama's original result. */
export type TrialResult = Extract<GramaResult, { kind: 'trial' }>;

/** Captures descriptors without changing any trial rewards or generator inputs. */
export function describeTrial(
  snapshot: TrialObservation,
  ranks: ReadonlyMap<string, number>,
): TrialPayload {
  return {
    ...snapshot,
    version: 1,
    presented: true,
    wheels: snapshot.wheels.map((wheel) => ({
      ...wheel,
      descriptor: describePuzzle(wheel.level, ranks),
    })),
  };
}

/** A run result uses ordinary game points, with skips kept as separate evidence. */
export function trialResult(snapshot: TrialObservation): TrialResult {
  return {
    kind: 'trial',
    run: { points: snapshot.points, cleared: snapshot.cleared, words: snapshot.words },
    skipped: snapshot.wheels.filter((wheel) => wheel.outcome === 'skipped').length,
  };
}

/** Validates trial totals before trusting an immutable outcome. */
export function isTrialResult(value: unknown): value is TrialResult {
  return (
    isObject(value) &&
    value.kind === 'trial' &&
    isObject(value.run) &&
    isCount(value.run.points) &&
    isCount(value.run.cleared) &&
    isCount(value.run.words) &&
    isCount(value.skipped)
  );
}

/** Validates ordered wheels and totals, using the same puzzle guard as numbered play. */
export function isTrialPayload(value: unknown): value is TrialPayload {
  if (
    !isObject(value) ||
    value.kind !== 'trial' ||
    value.version !== 1 ||
    typeof value.presented !== 'boolean' ||
    !isCount(value.seed) ||
    value.seed >= 2 ** 31 ||
    typeof value.timeLeft !== 'number' ||
    !Number.isFinite(value.timeLeft) ||
    value.timeLeft < 0 ||
    !isCount(value.points) ||
    !isCount(value.cleared) ||
    !isCount(value.words) ||
    !Array.isArray(value.wheels) ||
    value.wheels.length === 0
  )
    return false;
  let found = 0,
    cleared = 0;
  for (const [index, wheel] of value.wheels.entries()) {
    if (!isObject(wheel)) return false;
    const { outcome } = wheel;
    if (
      !isPuzzleSnapshot(wheel) ||
      Object.keys(wheel.session.revealed).length ||
      wheel.session.hintsWon !== 0 ||
      (index === value.wheels.length - 1
        ? outcome !== 'current' || isComplete(wheel.level, wheel.session)
        : outcome !== 'skipped' && outcome !== 'cleared') ||
      (outcome === 'cleared') !== isComplete(wheel.level, wheel.session)
    )
      return false;
    found += wheel.session.found.length;
    if (outcome === 'cleared') cleared++;
  }
  return found === value.words && cleared === value.cleared && evidenceJson(value) !== null;
}
