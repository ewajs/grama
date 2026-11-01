import type { Attempt, Exposure } from '../core/assessment/attempt';
import type { Timing } from '../core/assessment/timing';

/** A complete resumable observation; the game supplies and validates its own payload. */
export type Checkpoint<Payload> = {
  version: 2;
  /** Zero for a proposed new attempt; the store increments it on every committed write. */
  revision: number;
  attempt: Extract<Attempt<never>, { status: 'active' }>;
  clock: Timing;
  payload: Payload;
};

/** Immutable outcome and final game snapshot; its revision follows the last checkpoint. */
export type Finalized<Payload, Result> = Omit<Checkpoint<Payload>, 'attempt' | 'clock'> & {
  clock: { state: 'finished'; activeMs: number; timing: Timing['timing'] };
  attempt: Exclude<Attempt<Result>, { status: 'active' }>;
};

/** Ledger ownership prevents an encounter ID from being reused by another attempt. */
export type StoredExposure = Exposure & { attemptId: string };

const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && value.length > 0;
const duration = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;
const count = (value: unknown) => duration(value) && Number.isSafeInteger(value);

/** Canonical JSON for evidence equality, rejecting unsupported values and cyclic payloads. */
export function evidenceJson(value: unknown, parents = new Set<object>()): string | null {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value))
  )
    return JSON.stringify(value);
  if (typeof value !== 'object' || parents.has(value)) return null;
  if (
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) !== Object.prototype &&
    Object.getPrototypeOf(value) !== null
  )
    return null;
  parents.add(value);
  const parts = Array.isArray(value)
    ? Array.from(value, (entry) => evidenceJson(entry, parents))
    : Object.keys(value)
        .sort()
        .map((key) => {
          const part = evidenceJson((value as Record<string, unknown>)[key], parents);
          return part === null ? null : `${JSON.stringify(key)}:${part}`;
        });
  parents.delete(value);
  if (parts.some((part) => part === null)) return null;
  return Array.isArray(value) ? `[${parts.join(',')}]` : `{${parts.join(',')}}`;
}

/** Validates the shared exposure envelope before trusting browser data. */
export function isExposure(value: unknown): value is Exposure {
  return (
    object(value) &&
    text(value.encounterId) &&
    text(value.key) &&
    (value.kind === 'first' || value.kind === 'repeat' || value.kind === 'unknown')
  );
}

/** Validates the database-only owner as well as the public exposure fields. */
export function isStoredExposure(value: unknown): value is StoredExposure {
  return isExposure(value) && 'attemptId' in value && text(value.attemptId);
}

/** Validates shared fields, timing consistency and the adapter's game-specific payload. */
function isRecord<Payload>(
  value: unknown,
  isPayload: (value: unknown) => value is Payload,
): value is Checkpoint<Payload> | Finalized<Payload, unknown> {
  if (
    !object(value) ||
    value.version !== 2 ||
    !count(value.revision) ||
    !object(value.attempt) ||
    !object(value.clock)
  )
    return false;
  const { attempt, clock } = value;
  return (
    ['id', 'game', 'track', 'mode', 'rulesVersion', 'contentVersion'].every((key) =>
      text(attempt[key]),
    ) &&
    count(attempt.sequence) &&
    duration(attempt.startedAt) &&
    duration(attempt.activeMs) &&
    (attempt.timing === 'reliable' || attempt.timing === 'uncertain') &&
    Array.isArray(attempt.exposures) &&
    attempt.exposures.every(isExposure) &&
    new Set(attempt.exposures.map((entry) => entry.encounterId)).size ===
      attempt.exposures.length &&
    clock.activeMs === attempt.activeMs &&
    clock.timing === attempt.timing &&
    (clock.state === 'paused' ||
      clock.state === 'finished' ||
      (clock.state === 'running' &&
        object(clock.sample) &&
        text(clock.sample.visit) &&
        duration(clock.sample.ms))) &&
    isPayload(value.payload) &&
    evidenceJson(value) !== null
  );
}

/** Validates an active checkpoint or revision-zero proposal, including its game snapshot. */
export function isCheckpoint<Payload>(
  value: unknown,
  isPayload: (value: unknown) => value is Payload,
): value is Checkpoint<Payload> {
  return (
    isRecord(value, isPayload) &&
    value.attempt.status === 'active' &&
    value.clock.state !== 'finished'
  );
}

/** Validates a completed/abandoned outcome; completed results use a separate game guard. */
export function isFinalized<Payload, Result>(
  value: unknown,
  isPayload: (value: unknown) => value is Payload,
  isResult: (value: unknown) => value is Result,
): value is Finalized<Payload, Result> {
  return (
    isRecord(value, isPayload) &&
    value.revision > 0 &&
    value.attempt.sequence > 0 &&
    value.clock.state === 'finished' &&
    value.attempt.status !== 'active' &&
    duration(value.attempt.endedAt) &&
    (value.attempt.status === 'completed'
      ? isResult(value.attempt.result)
      : value.attempt.status === 'abandoned' && !('result' in value.attempt))
  );
}

/** Immutable identity, cumulative time and prior exposures must survive a checkpoint update. */
export function canAdvance<Payload, Result>(
  before: Checkpoint<Payload>,
  after: Checkpoint<Payload> | Finalized<Payload, Result>,
): boolean {
  const a = before.attempt,
    b = after.attempt;
  return (
    (
      [
        'id',
        'sequence',
        'game',
        'track',
        'mode',
        'rulesVersion',
        'contentVersion',
        'startedAt',
      ] as const
    ).every((key) => a[key] === b[key]) &&
    b.activeMs >= a.activeMs &&
    (a.timing !== 'uncertain' || b.timing === 'uncertain') &&
    a.exposures.every((old) => b.exposures.some((next) => evidenceJson(old) === evidenceJson(next)))
  );
}
