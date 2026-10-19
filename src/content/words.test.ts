import { describe, expect, it } from 'vitest';
import { spanish } from '../core/spanish';
import { buildWordList, CURATED_RANK, parseWordList, rankWords } from './words';

describe('parseWordList', () => {
  it('skips comments, like the license header, and blank lines', () => {
    expect(parseWordList('# MPL-2.0\n# more\nCASA\nMATE\n')).toEqual(['CASA', 'MATE']);
  });
});

describe('rankWords', () => {
  it('puts frequent dictionary words first, in frequency order', () => {
    const ranked = rankWords({
      dictionary: ['ARBOL', 'CASA', 'MATE', 'SOL'],
      frequency: ['MATE', 'SOL'],
      curated: [],
    });
    expect(ranked).toEqual(['MATE', 'SOL', 'ARBOL', 'CASA']);
  });

  it('leaves out frequent words that are neither in the dictionary nor curated', () => {
    const ranked = rankWords({ dictionary: ['CASA'], frequency: ['ART', 'CASA'], curated: [] });
    expect(ranked).toEqual(['CASA']);
  });

  it('ranks curated words no lower than CURATED_RANK', () => {
    const frequency = Array.from({ length: CURATED_RANK + 10 }, (_, index) => `W${index}`);
    const ranked = rankWords({
      dictionary: frequency,
      frequency: [...frequency, 'PIBE'],
      curated: ['BONDI', 'PIBE', 'W1'],
    });
    expect(ranked.indexOf('W1')).toBe(1);
    expect(ranked.indexOf('BONDI')).toBe(CURATED_RANK);
    expect(ranked.indexOf('PIBE')).toBe(CURATED_RANK + 1);
  });
});

describe('buildWordList', () => {
  const list = buildWordList(
    { dictionary: ['ÁRBOL', 'TENÉS', 'MATE'], frequency: ['MATE', 'TENÉS'], curated: ['CHABÓN'] },
    spanish,
  );

  it('ranks words without accents, as the game compares them', () => {
    expect(list.words).toEqual(['MATE', 'TENES', 'CHABON', 'ARBOL']);
  });

  it('remembers how each word is written', () => {
    expect(list.spellings.get('TENES')).toBe('TENÉS');
    expect(list.spellings.get('CHABON')).toBe('CHABÓN');
  });
});
