import { describe, expect, it } from 'vitest';
import { evaluate } from './evaluate';
import type { Level } from './level';

const level: Level = {
  letters: ['S', 'A', 'L', 'T', 'O', 'P'],
  targets: ['SOL', 'PLATO', 'PLATOS'],
  bonus: ['OLA', 'SAPO'],
  tier: 'medium',
};

describe('evaluate', () => {
  it('scores a new target at 10 points per letter', () => {
    expect(evaluate(level, [], 'PLATO')).toEqual({ kind: 'target', word: 'PLATO', points: 50 });
  });

  it('scores a new bonus word at 2 points per letter', () => {
    expect(evaluate(level, [], 'SAPO')).toEqual({ kind: 'bonus', word: 'SAPO', points: 8 });
  });

  it('rejects words that are not in the level', () => {
    expect(evaluate(level, [], 'TOPLA')).toEqual({ kind: 'invalid', word: 'TOPLA' });
  });

  it('rejects words shorter than the minimum', () => {
    expect(evaluate(level, [], 'LA')).toEqual({ kind: 'invalid', word: 'LA' });
  });

  it('gives nothing for a target or bonus word found before', () => {
    const found = ['SOL', 'OLA'];
    expect(evaluate(level, found, 'SOL')).toEqual({ kind: 'repeated', word: 'SOL' });
    expect(evaluate(level, found, 'OLA')).toEqual({ kind: 'repeated', word: 'OLA' });
  });
});
