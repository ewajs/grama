import { describe, expect, it } from 'vitest';
import { parseWordList, rankWords } from './words';

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
