import { expect, it } from 'vitest';
import { compareBaselines } from '../../core/assessment/baseline';
import { NEW_SESSION } from '../../core/session';
import type { Level } from '../../core/level';
import type { Finalized } from '../../storage/assessment-record';
import { baselineSample } from './baseline';
import { describePuzzle, GRAMA_RULES, type GramaResult } from './grama';
import type { GramaPayload } from './payload';
import { describeTrial, trialResult, type TrialObservation } from './trial';

const levels: Level[] = [
  {
    letters: [...'PLATOS'],
    targets: ['PLATOS', 'SAL', 'SOL'],
    bonus: ['OLA', 'TOS', 'SOPA'],
    tier: 'easy',
  },
  {
    letters: [...'CAMINO'],
    targets: ['CAMINO', 'AMO', 'MIO'],
    bonus: ['MANO', 'CIMA', 'COMA'],
    tier: 'easy',
  },
  {
    letters: [...'ROSADA'],
    targets: ['ROSADA', 'DOS', 'ASA'],
    bonus: ['ROSA', 'SODA', 'ARADO'],
    tier: 'easy',
  },
  {
    letters: [...'CANTOS'],
    targets: ['CANTOS', 'TAN', 'CON'],
    bonus: ['ACTO', 'CANTO', 'NOTAS'],
    tier: 'easy',
  },
];
const ranks = (level: Level, values = [2000, 50, 20]) =>
  new Map(level.targets.map((word, index) => [word, values[index] ?? 100]));

function completed<P extends GramaPayload, R extends GramaResult>(
  payload: P,
  result: R,
  keys: string[],
  sequence: number,
  activeMs: number,
) {
  const puzzle = 'place' in payload;
  return {
    version: 2,
    revision: 2,
    payload,
    clock: { state: 'finished', activeMs, timing: 'reliable' },
    attempt: {
      id: `attempt-${sequence}`,
      sequence,
      game: 'grama',
      track: puzzle ? 'word-solving' : 'time-trial',
      mode: puzzle ? payload.place.kind : 'trial',
      rulesVersion: puzzle ? GRAMA_RULES.puzzle : GRAMA_RULES.trial,
      contentVersion: '2',
      startedAt: 1000,
      endedAt: 1000 + activeMs,
      activeMs,
      timing: 'reliable',
      status: 'completed',
      result,
      exposures: keys.map((key, index) => ({
        key,
        encounterId: `${sequence}:${index}`,
        kind: 'first' as const,
      })),
    },
  } satisfies Finalized<P, R>;
}

function puzzle(sequence = 1, activeMs = 60000, level = levels[(sequence - 1) % levels.length]!) {
  const session = { ...NEW_SESSION, found: [...level.targets], points: 120 };
  const descriptor = describePuzzle(level, ranks(level));
  return completed(
    {
      version: 1 as const,
      place: {
        kind: 'level' as const,
        levelNumber: sequence,
        difficulty: 'normal' as const,
        occurrence: sequence - 1,
      },
      level,
      descriptor,
      session,
      replay: false,
      presented: true,
    },
    { kind: 'puzzle' as const, found: session.found, revealed: session.revealed },
    [descriptor.exposureKey],
    sequence,
    activeMs,
  );
}

function trial(points = 30) {
  const snapshot: TrialObservation = {
    kind: 'trial',
    seed: 7,
    timeLeft: 0,
    points,
    cleared: 0,
    words: 1,
    wheels: [
      { level: levels[0]!, session: { ...NEW_SESSION, found: ['SAL'] }, outcome: 'current' },
    ],
  };
  const payload = describeTrial(snapshot, ranks(levels[0]!));
  return completed(
    payload,
    trialResult(snapshot),
    payload.wheels.map((wheel) => wheel.descriptor.exposureKey),
    1,
    63000,
  );
}

it('projects duration with its identity and ignores word-game reward magnitudes', () => {
  const record = puzzle();
  const sample = baselineSample(record)!;
  expect(sample).toMatchObject({ id: 'attempt-1', sequence: 1, value: -60000 });
  record.payload.session.points = 9999;
  expect(baselineSample(record)).toEqual(sample);
});

it('feeds distinct recorded wheels into the existing baseline and preserves deduplication', () => {
  const records = [puzzle(1, 120000), puzzle(2, 100000), puzzle(3, 80000), puzzle(4, 60000)];
  const samples = [...records.toReversed(), structuredClone(records[0]!)].flatMap((record) => {
    const sample = baselineSample(record);
    return sample ? [sample] : [];
  });
  expect(
    new Set(records.flatMap((record) => record.attempt.exposures.map((e) => e.key))).size,
  ).toBe(4);
  expect(compareBaselines(samples, 2)).toMatchObject([
    {
      samples: 4,
      referenceIds: ['attempt-1', 'attempt-2'],
      recentIds: ['attempt-3', 'attempt-4'],
      comparison: 1,
    },
  ]);
});

it('keeps modes, content versions, tiers, difficulty bands, hints and bonus effort separate', () => {
  const original = puzzle(),
    base = baselineSample(original)!;
  const daily = puzzle();
  const dailyPayload = { ...daily.payload, place: { kind: 'daily' as const, date: '2026-11-01' } };
  const changed = [
    { ...daily, payload: dailyPayload, attempt: { ...daily.attempt, mode: 'daily' } },
    { ...original, attempt: { ...original.attempt, contentVersion: '3' } },
    puzzle(1, 60000, { ...levels[0]!, tier: 'hard' }),
    {
      ...original,
      payload: {
        ...original.payload,
        descriptor: describePuzzle(
          original.payload.level,
          ranks(original.payload.level, [3000, 80, 30]),
        ),
      },
    },
    {
      ...original,
      payload: {
        ...original.payload,
        session: { ...original.payload.session, revealed: { PLATOS: 1 } },
      },
      attempt: {
        ...original.attempt,
        result: { ...original.attempt.result, revealed: { PLATOS: 1 } },
      },
    },
    {
      ...original,
      payload: {
        ...original.payload,
        session: { ...original.payload.session, found: [...original.payload.session.found, 'OLA'] },
      },
      attempt: {
        ...original.attempt,
        result: { ...original.attempt.result, found: [...original.attempt.result.found, 'OLA'] },
      },
    },
  ];
  for (const record of changed) {
    expect(baselineSample(record)).not.toBeNull();
    expect(baselineSample(record)!.cohort).not.toBe(base.cohort);
  }
  const nearby = {
    ...original,
    payload: {
      ...original.payload,
      descriptor: describePuzzle(
        original.payload.level,
        ranks(original.payload.level, [2100, 51, 21]),
      ),
    },
  };
  expect(baselineSample(nearby)!.cohort).toBe(base.cohort);
});

it('separates wheel size and target count', () => {
  const larger: Level = {
    letters: [...'PLANTAS'],
    targets: ['PLANTAS', 'SAL', 'ALA'],
    bonus: ['PLAN', 'LANA', 'SALTA'],
    tier: 'easy',
  };
  const extraTarget: Level = {
    ...levels[0]!,
    targets: [...levels[0]!.targets, 'OLA'],
    bonus: ['TOS', 'SOPA'],
  };
  const base = baselineSample(puzzle())!;
  for (const level of [larger, extraTarget]) {
    const record = puzzle(1, 60000, level);
    expect(baselineSample(record)).not.toBeNull();
    expect(baselineSample(record)!.cohort).not.toBe(base.cohort);
  }
});

it.each(['repeat', 'unknown'] as const)('excludes %s exposure', (kind) => {
  const record = puzzle();
  expect(
    baselineSample({
      ...record,
      attempt: { ...record.attempt, exposures: [{ ...record.attempt.exposures[0]!, kind }] },
    }),
  ).toBeNull();
});

it('excludes unfinished, uncertain, replayed, zero-time and unacknowledged evidence', () => {
  const record = puzzle();
  const abandoned = { ...record, attempt: { ...record.attempt, status: 'abandoned' } };
  Reflect.deleteProperty(abandoned.attempt, 'result');
  const uncertain = {
    ...record,
    clock: { ...record.clock, timing: 'uncertain' },
    attempt: { ...record.attempt, timing: 'uncertain' },
  };
  for (const value of [
    abandoned,
    uncertain,
    puzzle(1, 0),
    { ...record, payload: { ...record.payload, replay: true } },
    { ...record, payload: { ...record.payload, presented: false } },
  ])
    expect(baselineSample(value)).toBeNull();
});

it('excludes unsupported protocols and inconsistent completed evidence', () => {
  const record = puzzle();
  const incomplete = {
    ...record,
    payload: { ...record.payload, session: { ...record.payload.session, found: ['PLATOS'] } },
    attempt: { ...record.attempt, result: { ...record.attempt.result, found: ['PLATOS'] } },
  };
  for (const value of [
    null,
    {},
    { ...record, version: 99 },
    { ...record, attempt: { ...record.attempt, rulesVersion: 'future' } },
    { ...record, attempt: { ...record.attempt, game: 'other' } },
    { ...record, attempt: { ...record.attempt, track: 'time-trial' } },
    { ...record, attempt: { ...record.attempt, mode: 'daily' } },
    {
      ...record,
      attempt: { ...record.attempt, result: { ...record.attempt.result, found: ['SAL'] } },
    },
    {
      ...record,
      attempt: {
        ...record.attempt,
        exposures: [{ ...record.attempt.exposures[0]!, key: 'wrong-wheel' }],
      },
    },
    {
      ...record,
      payload: { ...record.payload, descriptor: describePuzzle(record.payload.level, new Map()) },
    },
    incomplete,
  ])
    expect(baselineSample(value)).toBeNull();
});

it('uses trial points within one protocol and rejects mismatched results, wheels or unfinished countdown', () => {
  expect(baselineSample(trial(30))).toMatchObject({ value: 30 });
  expect(baselineSample(trial(60))!.cohort).toBe(baselineSample(trial(30))!.cohort);
  const record = trial();
  for (const value of [
    { ...record, payload: { ...record.payload, timeLeft: 1000 } },
    { ...record, attempt: { ...record.attempt, result: { ...record.attempt.result, skipped: 1 } } },
    {
      ...record,
      attempt: {
        ...record.attempt,
        result: { ...record.attempt.result, run: { ...record.attempt.result.run, points: 999 } },
      },
    },
    {
      ...record,
      attempt: {
        ...record.attempt,
        exposures: [
          ...record.attempt.exposures,
          { ...record.attempt.exposures[0]!, encounterId: 'other' },
        ],
      },
    },
    { ...record, attempt: { ...record.attempt, rulesVersion: 'future' } },
  ])
    expect(baselineSample(value)).toBeNull();
});
