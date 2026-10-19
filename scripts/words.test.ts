import { describe, expect, it } from 'vitest';
import { preferSpelling, spelling, spellings } from './words.ts';

describe('spelling', () => {
  it('uppercases, keeping accents and Ñ', () => {
    expect(spelling('tenés')).toBe('TENÉS');
    expect(spelling('ñandú')).toBe('ÑANDÚ');
  });

  it('drops capitalized words (names, acronyms), symbols and digits', () => {
    expect(spelling('Juan')).toBeNull();
    expect(spelling('ADN')).toBeNull();
    expect(spelling("o'clock")).toBeNull();
    expect(spelling('mp3')).toBeNull();
  });

  it('keeps words of 3 to 8 letters only', () => {
    expect(spelling('la')).toBeNull();
    expect(spelling('sol')).toBe('SOL');
    expect(spelling('pantalón')).toBe('PANTALÓN');
    expect(spelling('pantalones')).toBeNull();
  });
});

describe('spellings', () => {
  it('keeps one spelling per word, the first seen, in order', () => {
    expect(spellings(['está', 'casa', 'esta', 'mamá', 'mama'])).toEqual(['ESTÁ', 'CASA', 'MAMÁ']);
  });

  it('leaves out blocked words, whatever their accents', () => {
    expect(spellings(['casa', 'maría'], { blocked: new Set(['MARIA']) })).toEqual(['CASA']);
  });

  it('lets `prefer` replace a spelling, keeping the position of the first one seen', () => {
    const prefer = () => true;
    expect(spellings(['tenes', 'casa', 'tenés'], { prefer })).toEqual(['TENÉS', 'CASA']);
  });
});

describe('preferSpelling', () => {
  const prefer = preferSpelling((written) => written !== 'ARBOL');
  const seen = (written: string, position: number) => ({ written, position });

  it('prefers a proper spelling to one that is not', () => {
    expect(prefer(seen('ÁRBOL', 900), seen('ARBOL', 10))).toBe(true);
    expect(prefer(seen('ARBOL', 900), seen('ÁRBOL', 10))).toBe(false);
  });

  it('prefers the accented spelling unless it is much rarer', () => {
    expect(prefer(seen('TENÉS', 5585), seen('TENES', 2152))).toBe(true);
    expect(prefer(seen('ÉSTE', 1013), seen('ESTE', 32))).toBe(false);
  });
});
