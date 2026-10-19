import { describe, expect, it } from 'vitest';
import { canSpell, levelProblems, type Level } from './level';

describe('canSpell', () => {
  const letters = ['A', 'S', 'A', 'D', 'O', 'R'];

  it('accepts words using available letters in any order', () => {
    expect(canSpell(letters, 'ROSA')).toBe(true);
    expect(canSpell(letters, 'ASADOR')).toBe(true);
  });

  it('allows a letter as many times as it appears', () => {
    expect(canSpell(letters, 'ASADO')).toBe(true);
    expect(canSpell(letters, 'ASADA')).toBe(false);
  });

  it('rejects letters not on the wheel', () => {
    expect(canSpell(letters, 'MATE')).toBe(false);
  });
});

describe('levelProblems', () => {
  const valid: Level = {
    letters: ['S', 'O', 'L', 'A', 'R', 'E'],
    targets: ['SOL', 'ROSAL', 'ORALES'],
    bonus: ['OLA', 'SALE'],
    tier: 'medium',
  };

  it('finds nothing wrong with a valid level', () => {
    expect(levelProblems(valid)).toEqual([]);
  });

  it('requires enough letters', () => {
    const level = { ...valid, letters: ['S', 'O', 'L'], targets: ['SOL'], bonus: [] };
    expect(levelProblems(level)).toEqual(['has 3 letters, needs at least 6']);
  });

  it('rejects short words', () => {
    expect(levelProblems({ ...valid, bonus: ['LA'] })).toEqual(['LA is too short']);
  });

  it('rejects words the letters cannot spell', () => {
    expect(levelProblems({ ...valid, bonus: ['SOLO'] })).toEqual(["SOLO can't be spelled"]);
  });

  it('rejects repeated words, also across targets and bonus', () => {
    expect(levelProblems({ ...valid, bonus: ['SOL'] })).toEqual(['SOL appears twice']);
  });

  it('requires a target that uses every letter', () => {
    expect(levelProblems({ ...valid, targets: ['SOL', 'ROSAL'] })).toEqual([
      'no target uses every letter',
    ]);
  });
});
