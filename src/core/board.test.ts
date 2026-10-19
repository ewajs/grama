import { describe, expect, it } from 'vitest';
import { boardRows, byBoardOrder } from './board';
import type { Level } from './level';
import { NEW_SESSION } from './session';

const level: Level = {
  letters: ['S', 'A', 'L', 'T', 'O', 'P'],
  targets: ['PLATOS', 'SOL', 'PATO', 'SAL', 'SOPA'],
  bonus: ['OLA'],
  tier: 'medium',
};

describe('boardRows', () => {
  it('has one empty row per target, shortest first', () => {
    expect(
      boardRows(level, { ...NEW_SESSION, found: [], revealed: {} }).map((row) => row.length),
    ).toEqual([3, 3, 4, 4, 6]);
    expect(
      boardRows(level, { ...NEW_SESSION, found: [], revealed: {} }).every(
        (row) => row.word === null,
      ),
    ).toBe(true);
  });

  it('puts each found word in its own row, alphabetical within a length', () => {
    const rows = boardRows(level, { ...NEW_SESSION, found: ['SOPA', 'SOL'], revealed: {} });
    expect(rows.map((row) => row.word)).toEqual([null, 'SOL', null, 'SOPA', null]);
  });

  it('ignores bonus words', () => {
    expect(
      boardRows(level, { ...NEW_SESSION, found: ['OLA'], revealed: {} }).map((row) => row.word),
    ).toEqual([null, null, null, null, null]);
  });

  it("shows the letters hints revealed, in the word's own row", () => {
    const rows = boardRows(level, {
      ...NEW_SESSION,
      found: ['SOL'],
      revealed: { SAL: 1, SOPA: 2 },
    });
    expect(rows.slice(0, 4)).toEqual([
      { length: 3, word: 'SAL', shown: 1 },
      { length: 3, word: 'SOL', shown: 3 },
      { length: 4, word: null, shown: 0 },
      { length: 4, word: 'SOPA', shown: 2 },
    ]);
  });
});

describe('byBoardOrder', () => {
  it('sorts by length, then alphabetically', () => {
    expect(['TAX', 'CASA', 'CAT', 'CAN'].toSorted(byBoardOrder)).toEqual([
      'CAN',
      'CAT',
      'TAX',
      'CASA',
    ]);
  });

  it('puts Ñ between N and O, as Spanish does', () => {
    expect(['AOR', 'AÑO', 'ANO'].toSorted(byBoardOrder)).toEqual(['ANO', 'AÑO', 'AOR']);
  });
});
