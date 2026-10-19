import { describe, expect, it } from 'vitest';
import { hintTarget, revealLetter } from './hints';
import type { Level } from './level';
import { NEW_SESSION } from './session';

const level: Level = {
  letters: ['S', 'A', 'L', 'T', 'O', 'P'],
  targets: ['PLATOS', 'SOL', 'PATO', 'SAL'],
  bonus: ['OLA', 'LOS', 'LAS', 'TOS', 'ASO', 'OSA'],
  tier: 'medium',
};

const session = (found: string[], revealed: Record<string, number> = {}) => ({ found, revealed });

describe('hintTarget', () => {
  it('picks the target showing the fewest letters, shortest first', () => {
    expect(hintTarget(level, session([]))).toBe('SOL');
    expect(hintTarget(level, session([], { SOL: 1 }))).toBe('SAL');
    expect(hintTarget(level, session([], { SOL: 1, SAL: 1 }))).toBe('PATO');
  });

  it('skips found targets', () => {
    expect(hintTarget(level, session(['SOL']))).toBe('SAL');
  });

  it('never reveals the last letter of a word', () => {
    const almost = { SOL: 2, SAL: 2, PATO: 3, PLATOS: 5 };
    expect(hintTarget(level, session([], almost))).toBeNull();
  });
});

describe('revealLetter', () => {
  it('shows one more letter of the hint target', () => {
    expect(revealLetter(NEW_SESSION, level).revealed).toEqual({ SOL: 1 });
  });

  it('leaves the session as it was when nothing can be revealed', () => {
    const done = session([...level.targets]);
    expect(revealLetter(done, level)).toBe(done);
  });
});
