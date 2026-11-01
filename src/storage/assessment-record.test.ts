import { expect, it } from 'vitest';
import {
  canAdvance,
  evidenceJson,
  isCheckpoint,
  isExposure,
  isFinalized,
  type Checkpoint,
  type Finalized,
} from './assessment-record';

const fixture: Checkpoint<string[]> = {
  version: 2,
  revision: 1,
  attempt: {
    id: 'a',
    sequence: 1,
    game: 'g',
    track: 't',
    mode: 'm',
    rulesVersion: '1',
    contentVersion: '1',
    status: 'active',
    startedAt: 0,
    activeMs: 50,
    timing: 'reliable',
    exposures: [{ encounterId: 'e', key: 'wheel', kind: 'unknown' }],
  },
  clock: { state: 'running', activeMs: 50, timing: 'reliable', sample: { visit: 'v', ms: 100 } },
  payload: ['SOL'],
};
const payload = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((word) => typeof word === 'string');

it('validates a complete checkpoint and preserves unknown exposure', () => {
  expect(isCheckpoint(structuredClone(fixture), payload)).toBe(true);
});

it.each([
  { version: 1 },
  { payload: [null] },
  { payload: null },
  { attempt: { ...fixture.attempt, id: '' } },
  { attempt: { ...fixture.attempt, sequence: 0.5 } },
  { attempt: { ...fixture.attempt, startedAt: Infinity } },
  { attempt: { ...fixture.attempt, timing: ['reliable'] } },
  {
    attempt: {
      ...fixture.attempt,
      exposures: [...fixture.attempt.exposures, ...fixture.attempt.exposures],
    },
  },
  { clock: { ...fixture.clock, activeMs: Number.NaN } },
  { clock: { ...fixture.clock, activeMs: 49 } },
  { clock: { ...fixture.clock, timing: 'uncertain' } },
  { clock: { state: 'finished', activeMs: 50, timing: 'reliable' } },
  { clock: { ...fixture.clock, sample: { visit: '', ms: 1 } } },
])('rejects unsafe checkpoint fields: %j', (changes) => {
  expect(isCheckpoint({ ...fixture, ...changes }, payload)).toBe(false);
});

it('does not coerce malformed exposure enums into trusted classifications', () => {
  expect(isExposure({ encounterId: 'e', key: 'wheel', kind: ['first'] })).toBe(false);
});

it.each([
  { id: 'different' },
  { sequence: 2 },
  { mode: 'daily' },
  { contentVersion: '2' },
  { activeMs: 49 },
  { exposures: [] },
  { exposures: [{ encounterId: 'e', key: 'wheel', kind: 'first' as const }] },
])('rejects changes to identity or previously committed evidence: %j', (changes) => {
  expect(canAdvance(fixture, { ...fixture, attempt: { ...fixture.attempt, ...changes } })).toBe(
    false,
  );
});

it('permits accumulating time but never upgrading uncertain timing', () => {
  expect(canAdvance(fixture, { ...fixture, attempt: { ...fixture.attempt, activeMs: 100 } })).toBe(
    true,
  );
  const uncertain = { ...fixture, attempt: { ...fixture.attempt, timing: 'uncertain' as const } };
  expect(canAdvance(uncertain, fixture)).toBe(false);
});

it('compares JSON evidence independent of object property order, retaining array order', () => {
  expect(evidenceJson({ a: 1, b: [1, 2] })).toBe(evidenceJson({ b: [1, 2], a: 1 }));
  expect(evidenceJson({ a: [1, 2] })).not.toBe(evidenceJson({ a: [2, 1] }));
  const cycle: unknown[] = [];
  cycle.push(cycle);
  expect(evidenceJson(cycle)).toBeNull();
  expect(evidenceJson(new Date(0))).toBeNull();
  expect(evidenceJson({ bad: undefined })).toBeNull();
});

it('validates final status, result, revision and terminal timing', () => {
  const complete: Finalized<string[], number> = {
    ...fixture,
    clock: { activeMs: 50, timing: 'reliable', state: 'finished' },
    attempt: { ...fixture.attempt, status: 'completed', endedAt: 1, result: 10 },
  };
  const result = (value: unknown): value is number => typeof value === 'number' && value >= 0;
  expect(isFinalized(complete, payload, result)).toBe(true);
  expect(isFinalized({ ...complete, revision: 0 }, payload, result)).toBe(false);
  expect(isFinalized({ ...complete, clock: fixture.clock }, payload, result)).toBe(false);
  expect(
    isFinalized(
      { ...complete, attempt: { ...complete.attempt, result: 'wrong' } },
      payload,
      result,
    ),
  ).toBe(false);
});
