import { expect, it } from 'vitest';
import { NEW_SESSION } from '../../core/session';
import type { Level } from '../../core/level';
import { describePuzzle } from './grama';
import { extendsSession, isPuzzlePayload, isPuzzleResult, type PuzzlePayload } from './puzzle';

const level: Level = {
  letters: [...'PLATOS'],
  targets: ['PLATOS', 'SAL', 'SOL'],
  bonus: ['OLA', 'TOS', 'SOPA'],
  tier: 'easy',
};
const payload: PuzzlePayload = {
  version: 1,
  place: { kind: 'level', levelNumber: 1, difficulty: 'normal', occurrence: 0 },
  level,
  descriptor: describePuzzle(
    level,
    new Map([
      ['PLATOS', 20],
      ['SAL', 1],
      ['SOL', 2],
    ]),
  ),
  session: NEW_SESSION,
  replay: false,
  presented: true,
};

it('validates stored ranks without depending on a later dictionary or game save', () => {
  expect(isPuzzlePayload(structuredClone(payload))).toBe(true);
  expect(isPuzzleResult({ kind: 'puzzle', found: ['SAL'], revealed: { PLATOS: 1 } })).toBe(true);
});

it.each([
  { presented: undefined },
  { place: { kind: 'daily', date: '2026-02-30' } },
  { descriptor: { ...payload.descriptor, score: 100 } },
  { session: { ...NEW_SESSION, found: ['ZZZ'] } },
  { session: { ...NEW_SESSION, found: ['SAL', 'SAL'] } },
  { session: { ...NEW_SESSION, revealed: { SOPA: 1 } } },
  { session: { ...NEW_SESSION, revealed: { PLATOS: 6 } } },
])('rejects inconsistent puzzle snapshots: %j', (changes) => {
  expect(isPuzzlePayload({ ...payload, ...changes })).toBe(false);
});

it('distinguishes further play from reset and lost hint history', () => {
  const played = { ...NEW_SESSION, found: ['SAL'], points: 30, revealed: { PLATOS: 1 } };
  expect(extendsSession(NEW_SESSION, played)).toBe(true);
  expect(extendsSession(played, NEW_SESSION)).toBe(false);
  expect(extendsSession(played, { ...played, revealed: {} })).toBe(false);
});
