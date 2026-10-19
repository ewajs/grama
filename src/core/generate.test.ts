import { describe, expect, it } from 'vitest';
import { generateLevel, LEVEL_SHAPE } from './generate';
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

describe('generateLevel', () => {
  it('always builds the same level for the same number', () => {
    expect(generateLevel(words, 7, COMMON)).toEqual(generateLevel(words, 7, COMMON));
  });

  it('builds valid levels', () => {
    for (let number = 1; number <= 50; number++) {
      expect(levelProblems(generateLevel(words, number, COMMON))).toEqual([]);
    }
  });

  it('takes its letters from a common word of the right length', () => {
    const level = generateLevel(words, 3, COMMON);
    expect(level.letters).toHaveLength(LEVEL_SHAPE.letters);
    const seed = level.targets.find((word) => word.length === LEVEL_SHAPE.letters)!;
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
