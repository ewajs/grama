import { describe, expect, it } from 'vitest';
import blocklistText from '../../../scripts/blocklist-es.txt?raw';
import { occurrence, tierFor } from '../../core/cadence';
import { RECIPES, TIERS } from '../../core/difficulty';
import { generateLevel, levelShape } from '../../core/generate';
import { levelProblems } from '../../core/level';
import { spanish } from '../../core/spanish';
import { buildWordList, parseWordList } from '../words';
import curatedText from './argentina.txt?raw';
import dictionaryText from './dictionary.txt?raw';
import frequencyText from './frequency.txt?raw';

// The shipped Spanish lists, checked together with the generator on real data.
const lists = {
  dictionary: parseWordList(dictionaryText),
  frequency: parseWordList(frequencyText),
  curated: parseWordList(curatedText),
};
const { words, spellings } = buildWordList(lists, spanish);
const normalized = (list: readonly string[]) => new Set(list.map(spanish.normalize));
const dictionary = normalized(lists.dictionary);
const curated = normalized(lists.curated);

describe('Spanish word lists', () => {
  it('know how words are written', () => {
    expect(spellings.get('TENES')).toBe('TENÉS');
    expect(spellings.get('PODES')).toBe('PODÉS');
    expect(spellings.get('ARBOL')).toBe('ÁRBOL');
    expect(spellings.get('CHABON')).toBe('CHABÓN');
  });

  it('only offer dictionary or curated words as targets', () => {
    const targetable = words.slice(0, RECIPES.extra.pool);
    expect(targetable.every((word) => dictionary.has(word) || curated.has(word))).toBe(true);
  });

  it('let every curated Argentine word be a target', () => {
    const targetable = new Set(words.slice(0, RECIPES.extra.pool));
    expect([...curated].filter((word) => !targetable.has(word))).toEqual([]);
  });

  it('accept only real words: names, English and web noise from the frequency list are out', () => {
    const valid = new Set(words);
    for (const junk of ['THE', 'AND', 'MADRID', 'GARCIA', 'JAJAJA', 'GOOGLE']) {
      expect(valid.has(junk), junk).toBe(false);
    }
  });

  it('keep blocked words out of the curated list', () => {
    const blocked = normalized(parseWordList(blocklistText));
    expect([...curated].filter((word) => blocked.has(word))).toEqual([]);
  });

  it('generate valid levels of every size and tier', () => {
    const numbers = [...Array(20).keys()].map((index) => index + 1);
    for (const number of [...numbers, 25, 40, 41, 60, 100, 500, 1000]) {
      for (const tier of TIERS) {
        const level = generateLevel(words, number, tier);
        const shape = levelShape(number);
        expect(levelProblems(level), `level ${number} ${tier}`).toEqual([]);
        expect(level.letters).toHaveLength(shape.letters);
        expect(level.targets.length).toBeLessThanOrEqual(shape.targets);
        expect(level.targets.every((word) => word.length >= shape.shortestTarget)).toBe(true);
      }
    }
  });

  it('never repeat a level within 50 levels', () => {
    const lastSeen = new Map<string, number>();
    for (let number = 1; number <= 600; number++) {
      const tier = tierFor(number, 'normal');
      const level = generateLevel(words, number, tier, occurrence(number, 'normal'));
      const letters = level.letters.toSorted().join('');
      const previous = lastSeen.get(letters);
      if (previous !== undefined) expect(number - previous, `level ${number}`).toBeGreaterThan(50);
      lastSeen.set(letters, number);
    }
  });

  it('almost always land in the tier the cadence asks for, quickly', () => {
    const start = performance.now();
    let hits = 0;
    const count = 210;
    for (let number = 1; number <= count; number++) {
      if (
        generateLevel(words, number, tierFor(number, 'normal')).tier === tierFor(number, 'normal')
      )
        hits++;
    }
    const perLevel = (performance.now() - start) / count;
    expect(hits / count).toBeGreaterThan(0.9);
    expect(perLevel).toBeLessThan(150);
  });
});
