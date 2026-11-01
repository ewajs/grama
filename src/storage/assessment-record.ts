import type { Attempt, Exposure } from '../core/assessment/attempt';
import type { Timing } from '../core/assessment/timing';

/** A complete resumable observation; the game supplies and validates its own payload. */
export type Checkpoint<Payload> = {
  version: 1;
  attempt: Extract<Attempt<never>, { status: 'active' }>;
  clock: Timing;
  payload: Payload;
};

const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && value.length > 0;
const duration = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;
const count = (value: unknown) => duration(value) && Number.isSafeInteger(value);

/** Validates the shared exposure envelope before trusting browser data. */
export function isExposure(value: unknown): value is Exposure {
  return (
    object(value) &&
    text(value.encounterId) &&
    text(value.key) &&
    (value.kind === 'first' || value.kind === 'repeat' || value.kind === 'unknown')
  );
}

/** Validates shared fields, timing consistency and the adapter's game-specific payload. */
export function isCheckpoint<Payload>(
  value: unknown,
  isPayload: (value: unknown) => value is Payload,
): value is Checkpoint<Payload> {
  if (!object(value) || value.version !== 1 || !object(value.attempt) || !object(value.clock))
    return false;
  const { attempt, clock } = value;
  return (
    attempt.status === 'active' &&
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
      (clock.state === 'running' &&
        object(clock.sample) &&
        text(clock.sample.visit) &&
        duration(clock.sample.ms))) &&
    isPayload(value.payload)
  );
}
