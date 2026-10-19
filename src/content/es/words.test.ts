import { describe, expect, it } from 'vitest';
import blocklistText from '../../../scripts/blocklist-es.txt?raw';
import { COMMON_WORDS, generateLevel, levelShape } from '../../core/generate';
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
    const targetable = words.slice(0, COMMON_WORDS);
    expect(targetable.every((word) => dictionary.has(word) || curated.has(word))).toBe(true);
  });

  it('let every curated Argentine word be a target', () => {
    const targetable = new Set(words.slice(0, COMMON_WORDS));
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
