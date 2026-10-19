import { describe, expect, it } from 'vitest';
import { COMMON_WORDS, generateLevel } from '../../core/generate';
import { levelProblems } from '../../core/level';
import { parseWordList, rankWords } from '../words';
import dictionaryText from './dictionary.txt?raw';
import frequencyText from './frequency.txt?raw';

// The shipped Spanish lists, checked together with the generator on real data.
const dictionary = parseWordList(dictionaryText);
const words = rankWords(dictionary, parseWordList(frequencyText));

describe('Spanish word lists', () => {
  it('only offer dictionary words as targets', () => {
    const valid = new Set(dictionary);
    expect(words.slice(0, COMMON_WORDS).every((word) => valid.has(word))).toBe(true);
  });

  it('generate valid levels', () => {
    for (let number = 1; number <= 30; number++) {
      expect(levelProblems(generateLevel(words, number)), `level ${number}`).toEqual([]);
    }
  });
});
