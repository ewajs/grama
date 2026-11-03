import { expect, it } from 'vitest';
import { NEW_RATING, ratePeriod } from '../../core/assessment/glicko2';
import { NEW_SESSION } from '../../core/session';
import { describePuzzle, GRAMA_RULES } from './grama';
import { performanceHistory, ratingUpdate } from './performance';
import { describeTrial, trialResult } from './trial';

function puzzle(sequence = 1, hints = 0) {
  const level = {
      letters: [...'PLATOS'],
      targets: ['PLATOS', 'SAL', 'SOL'],
      bonus: ['OLA', 'TOS', 'SOPA'],
      tier: 'easy' as const,
    },
    session = { ...NEW_SESSION, found: level.targets, revealed: { PLATOS: hints } },
    descriptor = describePuzzle(level, new Map(level.targets.map((word) => [word, 300])));
  return {
    version: 2,
    revision: 2,
    payload: {
      version: 1,
      place: {
        kind: 'level',
        levelNumber: sequence,
        difficulty: 'normal',
        occurrence: sequence - 1,
      },
      level,
      descriptor,
      session,
      replay: false,
      presented: true,
    },
    clock: { state: 'finished', activeMs: 60000, timing: 'reliable' },
    attempt: {
      id: `puzzle-${sequence}`,
      sequence,
      game: 'grama',
      track: 'word-solving',
      mode: 'level',
      rulesVersion: GRAMA_RULES.puzzle,
      contentVersion: '2',
      startedAt: 1000,
      endedAt: 61000,
      activeMs: 60000,
      timing: 'reliable',
      status: 'completed',
      result: { kind: 'puzzle', found: session.found, revealed: session.revealed },
      exposures: [{ key: descriptor.exposureKey, encounterId: `wheel-${sequence}`, kind: 'first' }],
    },
  };
}

function trial(sequence = 10, points = 30) {
  const source = puzzle(sequence),
    snapshot = {
      kind: 'trial' as const,
      seed: 7,
      timeLeft: 0,
      points,
      cleared: 0,
      words: 1,
      wheels: [
        {
          level: source.payload.level,
          session: { ...NEW_SESSION, found: ['SAL'] },
          outcome: 'current' as const,
        },
      ],
    };
  return {
    ...source,
    payload: describeTrial(snapshot, new Map()),
    attempt: {
      ...source.attempt,
      id: `trial-${sequence}`,
      track: 'time-trial',
      mode: 'trial',
      rulesVersion: GRAMA_RULES.trial,
      result: trialResult(snapshot),
    },
  };
}

it('combines levels and dailies across content versions, orders by sequence and ignores duplicate copies', () => {
  const first = puzzle(1, 3),
    source = puzzle(2),
    daily = {
      ...source,
      payload: { ...source.payload, place: { kind: 'daily', date: '2026-11-02' } },
      attempt: { ...source.attempt, mode: 'daily', contentVersion: '3' },
    };
  const history = performanceHistory([daily, first, structuredClone(first)]);
  expect(history.puzzles.map(({ record }) => record.attempt.id)).toEqual(['puzzle-1', 'puzzle-2']);
  const matches = history.puzzles.map(({ match }) => match!);
  expect(matches[1]!.score).toBeGreaterThan(matches[0]!.score);
  expect(history).toMatchObject({
    version: 2,
    current: ratePeriod(ratePeriod(NEW_RATING, [matches[0]!]), [matches[1]!]),
    trend: null,
  });
  expect(performanceHistory([first, daily])).toEqual(history);
});

it('keeps practice and missing difficulty in history without changing score or trend', () => {
  const first = puzzle(),
    replay = puzzle(2),
    repeated = puzzle(3),
    missing = puzzle(4);
  replay.payload.replay = true;
  repeated.attempt.exposures[0]!.kind = 'repeat';
  missing.payload.descriptor = describePuzzle(missing.payload.level, new Map());
  const history = performanceHistory([first, replay, repeated, missing]);
  expect(history.puzzles.map(({ rating }) => rating)).toEqual([history.current, null, null, null]);
  expect(history.current).toEqual(performanceHistory([first]).current);
});

it('uses unknown exposure and falls back to difficulty/assistance when timing is unavailable', () => {
  const unknown = puzzle(),
    uncertain = puzzle(2),
    zero = puzzle(3);
  unknown.attempt.exposures[0]!.kind = 'unknown';
  uncertain.clock.timing = uncertain.attempt.timing = 'uncertain';
  zero.clock.activeMs = zero.attempt.activeMs = 0;
  const history = performanceHistory([unknown, uncertain, zero]);
  expect(history.puzzles[0]?.rating).toEqual(performanceHistory([puzzle()]).current);
  expect(history.puzzles[1]?.match).not.toBeNull();
  expect(history.puzzles[1]?.match).toEqual(history.puzzles[2]?.match);
  expect(unknown.attempt.exposures[0]?.kind).toBe('unknown');
});

it('gives extra words a small bonus, independently of game reward points', () => {
  const original = puzzle(),
    bonus = puzzle();
  bonus.payload.session.found = [...bonus.payload.session.found, 'OLA'];
  bonus.attempt.result.found = bonus.payload.session.found;
  bonus.payload.session.points = 9999;
  expect(performanceHistory([bonus]).current!.rating).toBeGreaterThan(
    performanceHistory([original]).current!.rating,
  );
  const before = performanceHistory([bonus]).current;
  bonus.payload.session.points = 0;
  expect(performanceHistory([bonus]).current).toEqual(before);
});

it('excludes abandoned, inconsistent, unpresented and unsupported evidence without counting losses', () => {
  const record = puzzle(),
    abandoned = { ...record, attempt: { ...record.attempt, status: 'abandoned' } };
  Reflect.deleteProperty(abandoned.attempt, 'result');
  const inputs = [
    null,
    {},
    abandoned,
    { ...record, version: 99 },
    { ...record, payload: { ...record.payload, presented: false } },
    { ...record, attempt: { ...record.attempt, game: 'other' } },
    { ...record, attempt: { ...record.attempt, mode: 'daily' } },
    { ...record, attempt: { ...record.attempt, rulesVersion: 'future' } },
    {
      ...record,
      attempt: { ...record.attempt, result: { ...record.attempt.result, found: ['SAL'] } },
    },
    { ...record, attempt: { ...record.attempt, exposures: [] } },
    {
      ...record,
      payload: { ...record.payload, session: { ...record.payload.session, found: ['SAL'] } },
      attempt: { ...record.attempt, result: { ...record.attempt.result, found: ['SAL'] } },
    },
  ];
  for (const value of inputs)
    expect(performanceHistory([value])).toMatchObject({ puzzles: [], current: null, trend: null });
});

it('rejects conflicting IDs and sequences rather than depending on read order', () => {
  const first = puzzle(),
    conflict = puzzle(1, 1),
    sameSequence = puzzle();
  sameSequence.attempt.id = 'different';
  expect(() => performanceHistory([first, conflict])).toThrow(/Conflicting/);
  expect(() => performanceHistory([sameSequence, first])).toThrow(/Conflicting/);
});

it('keeps timed-mode points and best separate, including repeated wheels and uncertain timing', () => {
  const run = trial();
  run.attempt.exposures[0]!.kind = 'repeat';
  run.clock.timing = run.attempt.timing = 'uncertain';
  expect(performanceHistory([run, puzzle(), structuredClone(run)])).toMatchObject({
    trials: [run],
    trialBest: 30,
    trend: null,
  });
  expect(performanceHistory([run]).current).toBeNull();
  const better = trial(11, 60);
  expect(performanceHistory([better, run])).toMatchObject({ trials: [run, better], trialBest: 60 });
  expect(performanceHistory([]).trialBest).toBeNull();
  expect(performanceHistory([{ ...run, payload: { ...run.payload, timeLeft: 1 } }]).trials).toEqual(
    [],
  );
  expect(
    performanceHistory([
      { ...run, attempt: { ...run.attempt, result: { ...run.attempt.result, skipped: 1 } } },
    ]).trials,
  ).toEqual([]);
});

it('associates changes with the exact attempt and the displayed rounded values', () => {
  const history = performanceHistory([puzzle(1), puzzle(2)]);
  expect(ratingUpdate(history, 'puzzle-1')).toEqual({
    rating: history.puzzles[0]!.rating!.rating,
    change: null,
  });
  history.puzzles[0]!.rating!.rating = 1500.49;
  history.puzzles[1]!.rating!.rating = 1508.51;
  expect(ratingUpdate(history, 'puzzle-2')).toEqual({ rating: 1508.51, change: 9 });
  expect(ratingUpdate(history, 'missing')).toBeNull();
  const replay = puzzle(3);
  replay.payload.replay = true;
  expect(ratingUpdate(performanceHistory([puzzle(1), replay]), 'puzzle-3')).toBeNull();
});
