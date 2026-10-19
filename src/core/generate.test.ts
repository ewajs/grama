import { describe, expect, it } from 'vitest';
import { generateLevel, levelShape } from './generate';
import { canSpell, levelProblems } from './level';

// A small list, most common first. The first 20 count as common in these tests.
const words = [
  'SOL',
  'SAL',
  'PATO',
  'SOPA',
  'ALTO',
  'PLATO',
  'SALTO',
  'PLATOS',
  'CAMINO',
  'MANO',
  'CIMA',
  'COMA',
  'AMO',
  'CAMION',
  'ROSA',
  'DOS',
  'SODA',
  'ASADOR',
  'ROSADA',
  'DAR',
  'POSTAL',
  'LAPSO',
  'OLA',
  'TOS',
  'IMAN',
  'ANIMO',
  'COIMA',
  'ARADO',
  'ASADO',
  'ODA',
];
const COMMON = 20;

describe('levelShape', () => {
  it('follows the difficulty curve', () => {
    expect(levelShape(1)).toMatchObject({ letters: 6, targets: 6 });
    expect(levelShape(5)).toMatchObject({ letters: 6, targets: 6 });
    expect(levelShape(6)).toMatchObject({ letters: 6, targets: 8 });
    expect(levelShape(16)).toMatchObject({ letters: 7, targets: 10 });
    expect(levelShape(40)).toMatchObject({ letters: 7 });
    expect(levelShape(41)).toMatchObject({ letters: 8, targets: 12, shortestTarget: 4 });
    expect(levelShape(5000)).toMatchObject({ letters: 8 });
  });
});

describe('generateLevel', () => {
  it('always builds the same level for the same number', () => {
    expect(generateLevel(words, 7, COMMON)).toEqual(generateLevel(words, 7, COMMON));
  });

  it('builds valid levels', () => {
    // This small list only has 6-letter words to spare: levels 1-15 (see DIFFICULTY).
    for (let number = 1; number <= 15; number++) {
      expect(levelProblems(generateLevel(words, number, COMMON))).toEqual([]);
    }
  });

  it('takes its letters from a common word of the right length', () => {
    const level = generateLevel(words, 3, COMMON);
    expect(level.letters).toHaveLength(6);
    const seed = level.targets.find((word) => word.length === 6)!;
    expect(words.indexOf(seed)).toBeLessThan(COMMON);
  });

  it('makes every spellable word valid, but only common ones targets', () => {
    const level = generateLevel(words, 1, COMMON);
    const spellable = words.filter((word) => canSpell(level.letters, word));
    expect([...level.targets, ...level.bonus].sort()).toEqual(spellable.sort());
    for (const target of level.targets) expect(words.indexOf(target)).toBeLessThan(COMMON);
  });

  it('gives up with a clear error when no word can make a level', () => {
    expect(() => generateLevel(['SOL', 'SAL'], 1)).toThrow('No 6-letter word');
  });
});
