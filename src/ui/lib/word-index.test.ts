import { describe, expect, it } from 'vitest';
import { wordIndex } from './word-index';

describe('wordIndex', () => {
  it('groups words by first letter, in Spanish alphabetical order', () => {
    expect(wordIndex(['SOL', 'ÑANDU', 'SAL', 'NIDO', 'OSO', 'AÑO', 'ANO'])).toEqual([
      { letter: 'A', words: ['ANO', 'AÑO'] },
      { letter: 'N', words: ['NIDO'] },
      { letter: 'Ñ', words: ['ÑANDU'] },
      { letter: 'O', words: ['OSO'] },
      { letter: 'S', words: ['SAL', 'SOL'] },
    ]);
  });

  it('keeps the words starting with what is searched, ignoring case and accents', () => {
    expect(wordIndex(['SOL', 'SAL', 'SOPA', 'OSO'], ' só ')).toEqual([
      { letter: 'S', words: ['SOL', 'SOPA'] },
    ]);
    expect(wordIndex(['SOL'], 'x')).toEqual([]);
  });

  it('is empty for an empty dictionary', () => {
    expect(wordIndex([])).toEqual([]);
  });
});
