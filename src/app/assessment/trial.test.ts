import { expect, it } from 'vitest';
import { NEW_SESSION } from '../../core/session';
import type { Level } from '../../core/level';
import {
  describeTrial,
  isTrialPayload,
  isTrialResult,
  trialResult,
  type TrialObservation,
} from './trial';
import { isGramaPayload, isGramaResult } from './payload';
import { Trial } from '../time-trial.svelte';

const level: Level = {
  letters: [...'PLATOS'],
  targets: ['PLATOS', 'SOL', 'SAL'],
  bonus: ['OLA', 'TOS', 'SOPA'],
  tier: 'easy',
};
const snapshot: TrialObservation = {
  kind: 'trial',
  seed: 7,
  timeLeft: 50000,
  points: 120,
  cleared: 1,
  words: 3,
  wheels: [
    { level, session: { ...NEW_SESSION, found: level.targets }, outcome: 'cleared' },
    { level, session: NEW_SESSION, outcome: 'skipped' },
    { level, session: NEW_SESSION, outcome: 'current' },
  ],
};
const payload = describeTrial(
  snapshot,
  new Map([
    ['PLATOS', 0],
    ['SAL', 1],
    ['SOL', 2],
  ]),
);

it('validates original trial wheels and results through the mixed Grama guards', () => {
  expect(isTrialPayload(payload)).toBe(true);
  expect(isGramaPayload(payload)).toBe(true);
  expect(isGramaResult(trialResult(snapshot))).toBe(true);
  expect(trialResult(snapshot)).toEqual({
    kind: 'trial',
    run: { points: 120, cleared: 1, words: 3 },
    skipped: 1,
  });
  expect(
    isTrialResult({ kind: 'trial', run: { points: 0, cleared: 0, words: 0 }, skipped: -1 }),
  ).toBe(false);
});

it.each([
  { words: 4 },
  { cleared: 0 },
  { seed: 2 ** 31 },
  { timeLeft: NaN },
  { wheels: [] },
  { wheels: [{ ...payload.wheels[0], outcome: 'current' }] },
  { wheels: [payload.wheels[2], payload.wheels[2]] },
  {
    wheels: [{ ...payload.wheels[2], descriptor: { ...payload.wheels[2]!.descriptor, score: 99 } }],
  },
])('rejects inconsistent trial evidence: %j', (changes) => {
  expect(isTrialPayload({ ...payload, ...changes })).toBe(false);
});

it('retains the solved final word, skipped content and fresh restart identity', () => {
  const trial = new Trial(
    {
      words: [
        'SOL',
        'SAL',
        'PLATO',
        'PLATOS',
        'POSTAL',
        'SALTO',
        'SOPA',
        'PATO',
        'OLA',
        'TOS',
        'LAPSO',
        'ALTO',
      ],
      spellings: new Map(),
    },
    () => 0.5,
  );
  const first = trial.observation;
  const initialKey = trial.recordingKey;
  for (const word of trial.level.targets) trial.submit(word);
  const cleared = trial.observation;
  expect(cleared.wheels[0]!.session.found).toEqual(first.wheels[0]!.level.targets);
  expect(cleared.wheels[0]!.outcome).toBe('cleared');
  expect(cleared.wheels[1]!.session.found).toEqual([]);
  expect(first.wheels[0]!.session.found).toEqual([]);
  trial.pass();
  expect(trial.observation.wheels.map((wheel) => wheel.outcome)).toEqual([
    'cleared',
    'skipped',
    'current',
  ]);
  expect(() => structuredClone(trial.observation)).not.toThrow();
  trial.restart();
  expect(trial.recordingKey).not.toBe(initialKey);
  expect(trial.observation.wheels).toHaveLength(1);
  expect(trial.observation.words).toBe(0);
});
