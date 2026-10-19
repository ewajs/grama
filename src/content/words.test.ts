import { describe, expect, it } from 'vitest';
import { spanish } from '../core/spanish';
import { buildWordList, parseWordList, rankWords } from './words';

describe('parseWordList', () => {
  it('skips the license header and blank lines', () => {
    expect(parseWordList('# MPL-2.0\n# more\nCASA\nMATE\n')).toEqual(['CASA', 'MATE']);
  });
});

describe('rankWords', () => {
  it('puts frequent dictionary words first, in frequency order', () => {
    const ranked = rankWords(['ARBOL', 'CASA', 'MATE', 'SOL'], ['MATE', 'JUAN', 'SOL']);
    expect(ranked).toEqual(['MATE', 'SOL', 'ARBOL', 'CASA', 'JUAN']);
  });
});

describe('buildWordList', () => {
  const list = buildWordList(['ÁRBOL', 'TENÉS', 'MATE'], ['MATE', 'TENÉS'], spanish);

  it('ranks words without accents, as the game compares them', () => {
    expect(list.words).toEqual(['MATE', 'TENES', 'ARBOL']);
  });

  it('remembers how each word is written', () => {
    expect(list.spellings.get('TENES')).toBe('TENÉS');
    expect(list.spellings.get('ARBOL')).toBe('ÁRBOL');
  });
});
