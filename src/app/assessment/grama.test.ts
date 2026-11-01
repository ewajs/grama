import { expect, it } from 'vitest';
import { eligibilityOf, exposureFor, type Attempt } from '../../core/assessment/attempt';
import { describePuzzle, puzzleIdentity, type GramaResult } from './grama';
import { levelScore } from '../../core/difficulty';

const puzzle = { letters: [...'PLATOS'], targets: ['PLATOS', 'SAL', 'SOL'] };

it('describes target difficulty with the existing formula and keeps board size separate', () => {
  const ranks = new Map([
    ['PLATOS', 999],
    ['SAL', 99],
    ['SOL', 49],
  ]);
  const descriptor = describePuzzle({ ...puzzle, tier: 'easy' }, ranks);
  expect(descriptor).toMatchObject({ version: 1, wheelSize: 6, targetCount: 3, tier: 'easy' });
  expect(descriptor.score).toBeCloseTo(
    levelScore(
      puzzle.targets.map((word) => ({ length: word.length, rank: ranks.get(word)! })),
      6,
    ),
  );
  expect(descriptor.targets.find(({ word }) => word === 'PLATOS')).toEqual({
    word: 'PLATOS',
    length: 6,
    rank: 999,
  });
  expect(
    describePuzzle({ ...puzzle, tier: 'easy', targets: [...puzzle.targets].reverse() }, ranks),
  ).toEqual(descriptor);
});

it.each([undefined, -1, Infinity, Number.NaN, 0.5])(
  'retains unknown rank %s explicitly, without a fabricated score',
  (rank) => {
    const ranks = rank === undefined ? new Map<string, number>() : new Map([['SOL', rank]]);
    const descriptor = describePuzzle(
      { letters: [...'PLATOS'], targets: ['SOL'], tier: 'easy' },
      ranks,
    );
    expect(descriptor.targets).toEqual([{ word: 'SOL', length: 3, rank: null }]);
    expect(descriptor.score).toBeNull();
  },
);

it('distinguishes rank zero from a missing word and avoids an empty-board NaN', () => {
  expect(
    describePuzzle({ ...puzzle, tier: 'easy', targets: ['SOL'] }, new Map([['SOL', 0]])).score,
  ).toBe(0);
  expect(describePuzzle({ ...puzzle, tier: 'easy', targets: [] }, new Map()).score).toBeNull();
});

it('keeps assistance in completed puzzle evidence and skipped wheels in trial evidence', () => {
  const attempt: Attempt<GramaResult> = {
    id: 'level-attempt',
    sequence: 1,
    game: 'grama',
    track: 'word-solving',
    mode: 'daily',
    rulesVersion: '1',
    contentVersion: '2',
    startedAt: 100,
    activeMs: 50,
    timing: 'reliable',
    status: 'completed',
    endedAt: 150,
    exposures: [exposureFor(puzzleIdentity(puzzle).exposureKey, 'daily-wheel', [], 'complete')],
    result: { kind: 'puzzle', found: puzzle.targets, revealed: { PLATOS: 1 } },
  };
  expect(eligibilityOf(attempt)).toEqual({ eligible: true });
  expect(attempt.result).toMatchObject({ revealed: { PLATOS: 1 } });
  const trial: Attempt<GramaResult> = {
    ...attempt,
    id: 'trial-attempt',
    track: 'trial',
    mode: 'trial',
    result: { kind: 'trial', run: { points: 300, cleared: 1, words: 7 }, skipped: 1 },
  };
  expect(eligibilityOf(trial)).toEqual({ eligible: true });
  expect(trial.result).toMatchObject({ skipped: 1 });
});

it('recognizes shuffled wheels and target ordering without mutating the puzzle', () => {
  const reordered = { letters: [...'SOLTAP'], targets: [...puzzle.targets].reverse() };
  expect(puzzleIdentity(reordered)).toEqual(puzzleIdentity(puzzle));
  expect(puzzle.letters.join('')).toBe('PLATOS');
  expect(puzzle.targets[0]).toBe('PLATOS');
});

it('recognizes the same content across level, daily, trial and generator changes', () => {
  const numbered = { ...puzzle, levelNumber: 1 };
  const daily = { ...puzzle, date: '2026-11-01', version: 3 };
  const before = puzzleIdentity(numbered);
  const after = puzzleIdentity(daily);
  expect(before).toEqual(after);
  const seen = exposureFor(before.exposureKey, 'level-1', [], 'complete');
  expect(exposureFor(after.exposureKey, 'daily-1', [seen], 'complete').kind).toBe('repeat');
});

it('treats new targets on familiar letters as practice, preserving exact challenge identity', () => {
  const other = puzzleIdentity({ ...puzzle, targets: ['SALTO', 'SOPA', 'PLATOS'] });
  expect(other.challengeId).not.toBe(puzzleIdentity(puzzle).challengeId);
  expect(other.exposureKey).toBe(puzzleIdentity(puzzle).exposureKey);
});

it('distinguishes repeated letters and Ñ from N; familiar words alone do not mark a new wheel', () => {
  const key = (letters: string) =>
    puzzleIdentity({ letters: [...letters], targets: ['SOL'] }).exposureKey;
  expect(key('SOLANA')).not.toBe(key('SOLANO'));
  expect(key('SOLANA')).not.toBe(key('SOLAÑA'));
  expect(key('SOLANA')).not.toBe(key('PLATOS'));
});
