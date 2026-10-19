import { describe, expect, it } from 'vitest';
import { gameWord, gameWords } from './words.ts';

describe('gameWord', () => {
  it('normalizes Spanish words', () => {
    expect(gameWord('tenés')).toBe('TENES');
    expect(gameWord('ñandú')).toBe('ÑANDU');
  });

  it('drops capitalized words (names, acronyms), symbols and digits', () => {
    expect(gameWord('Juan')).toBeNull();
    expect(gameWord('ADN')).toBeNull();
    expect(gameWord("o'clock")).toBeNull();
    expect(gameWord('mp3')).toBeNull();
  });

  it('keeps words of 3 to 8 letters only', () => {
    expect(gameWord('la')).toBeNull();
    expect(gameWord('sol')).toBe('SOL');
    expect(gameWord('pantalón')).toBe('PANTALON');
    expect(gameWord('pantalones')).toBeNull();
  });
});

describe('gameWords', () => {
  it('keeps the first of words that normalize the same, in order', () => {
    expect(gameWords(['sé', 'casa', 'mamá', 'mama'])).toEqual(['CASA', 'MAMA']);
  });

  it('leaves out blocked words', () => {
    expect(gameWords(['casa', 'mate'], new Set(['MATE']))).toEqual(['CASA']);
  });
});
