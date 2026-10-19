import { describe, expect, it } from 'vitest';
import { COMMON_WORDS, generateLevel, levelShape } from '../../core/generate';
import { levelProblems } from '../../core/level';
import { spanish } from '../../core/spanish';
import { buildWordList, parseWordList } from '../words';
import dictionaryText from './dictionary.txt?raw';
import frequencyText from './frequency.txt?raw';

// The shipped Spanish lists, checked together with the generator on real data.
const dictionaryList = parseWordList(dictionaryText);
const { words, spellings } = buildWordList(dictionaryList, parseWordList(frequencyText), spanish);
const dictionary = dictionaryList.map(spanish.normalize);

describe('Spanish word lists', () => {
  it('know how words are written', () => {
    expect(spellings.get('TENES')).toBe('TENÉS');
    expect(spellings.get('ARBOL')).toBe('ÁRBOL');
    expect(spellings.get('AÑO')).toBe('AÑO');
  });

  it('only offer dictionary words as targets', () => {
    const valid = new Set(dictionary);
    expect(words.slice(0, COMMON_WORDS).every((word) => valid.has(word))).toBe(true);
  });

  it('generate valid levels along the whole difficulty curve', () => {
    const numbers = [...Array(20).keys()].map((index) => index + 1);
    for (const number of [...numbers, 25, 40, 41, 60, 100, 500, 1000]) {
      const level = generateLevel(words, number);
      const shape = levelShape(number);
      expect(levelProblems(level), `level ${number}`).toEqual([]);
      expect(level.letters).toHaveLength(shape.letters);
      expect(level.targets.length).toBeLessThanOrEqual(shape.targets);
      expect(level.targets.every((word) => word.length >= shape.shortestTarget)).toBe(true);
    }
  });
});
