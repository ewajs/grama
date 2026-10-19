import { describe, expect, it } from 'vitest';
import { boardRows } from './board';
import type { Level } from './level';

const level: Level = {
  letters: ['S', 'A', 'L', 'T', 'O', 'P'],
  targets: ['PLATOS', 'SOL', 'PATO', 'SAL', 'SOPA'],
  bonus: ['OLA'],
};

describe('boardRows', () => {
  it('has one empty row per target, shortest first', () => {
    expect(boardRows(level, []).map((row) => row.length)).toEqual([3, 3, 4, 4, 6]);
    expect(boardRows(level, []).every((row) => row.word === null)).toBe(true);
  });

  it('fills the rows of each length in the order words were found', () => {
    const rows = boardRows(level, ['SOPA', 'SAL', 'PATO']);
    expect(rows.map((row) => row.word)).toEqual(['SAL', null, 'SOPA', 'PATO', null]);
  });

  it('ignores bonus words', () => {
    expect(boardRows(level, ['OLA']).map((row) => row.word)).toEqual([
      null,
      null,
      null,
      null,
      null,
    ]);
  });

  it('shows the letters hints revealed, after found words of the same length', () => {
    const rows = boardRows(level, ['SAL'], { SOL: 1, PATO: 2 });
    expect(rows.slice(0, 4)).toEqual([
      { length: 3, word: 'SAL', shown: 3 },
      { length: 3, word: 'SOL', shown: 1 },
      { length: 4, word: 'PATO', shown: 2 },
      { length: 4, word: null, shown: 0 },
    ]);
  });
});
