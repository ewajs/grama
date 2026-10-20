import { describe, expect, it } from 'vitest';
import { TIERS } from './difficulty';
import { generateLevel, levelShape } from './generate';
import { THREE_STAR_BONUS } from './history';
import { canSpell, levelProblems } from './level';

// A small list, most common first; every word is within any tier's pool.
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

describe('levelShape', () => {
  it('grows with progress', () => {
    expect(levelShape(1)).toMatchObject({ letters: 6, shortestTarget: 3 });
    expect(levelShape(15)).toMatchObject({ letters: 6 });
    expect(levelShape(16)).toMatchObject({ letters: 7 });
    expect(levelShape(40)).toMatchObject({ letters: 7 });
    expect(levelShape(41)).toMatchObject({ letters: 8, shortestTarget: 4 });
    expect(levelShape(5000)).toMatchObject({ letters: 8 });
  });

  it('asks harder tiers for more targets, up to ten', () => {
    const most = (levelNumber: number) =>
      TIERS.map((tier) => levelShape(levelNumber, tier).targets);
    expect(most(1)).toEqual([5, 6, 7, 8]);
    expect(most(16)).toEqual([6, 7, 8, 9]);
    expect(most(41)).toEqual([7, 8, 9, 10]);
  });
});

describe('generateLevel', () => {
  it('always builds the same level for the same number and tier', () => {
    expect(generateLevel(words, 7, 'hard')).toEqual(generateLevel(words, 7, 'hard'));
  });

  it('builds valid levels of every tier', () => {
    // This small list only has 6-letter words to spare: levels 1-15 (see SIZES).
    for (const tier of TIERS) {
      for (let number = 1; number <= 15; number++) {
        expect(levelProblems(generateLevel(words, number, tier))).toEqual([]);
      }
    }
  });

  it('leaves enough bonus words for three stars', () => {
    for (let number = 1; number <= 15; number++) {
      expect(generateLevel(words, number).bonus.length).toBeGreaterThanOrEqual(THREE_STAR_BONUS);
    }
  });

  it('takes its letters from a word of the right length', () => {
    const level = generateLevel(words, 3);
    expect(level.letters).toHaveLength(6);
    expect(level.targets.some((word) => word.length === 6)).toBe(true);
  });

  it('makes every word the letters spell valid, as a target or a bonus word', () => {
    const level = generateLevel(words, 1);
    const spellable = words.filter((word) => canSpell(level.letters, word));
    expect([...level.targets, ...level.bonus].sort()).toEqual(spellable.sort());
  });

  it('labels each level with a tier', () => {
    expect(TIERS).toContain(generateLevel(words, 1, 'easy').tier);
  });

  it('gives up with a clear error when no word can make a level', () => {
    expect(() => generateLevel(['SOL', 'SAL'], 1)).toThrow('No 6-letter word');
  });
});
