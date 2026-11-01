import { expect, it } from 'vitest';
import { isCheckpoint, isExposure, type Checkpoint } from './assessment-record';

const fixture: Checkpoint<string[]> = {
  version: 1,
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
  { version: 2 },
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
