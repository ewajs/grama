import { describe, expect, it } from 'vitest';
import { voseoForms } from './voseo.ts';

describe('voseoForms', () => {
  it('builds present and imperative for each conjugation', () => {
    const words = new Set(['jugar', 'jugando', 'poder', 'podía', 'vivir', 'viviendo']);
    expect(voseoForms(words).sort()).toEqual(['jugá', 'jugás', 'podé', 'podés', 'viví', 'vivís']);
  });

  it('leaves out words that only look like infinitives', () => {
    expect(voseoForms(new Set(['mar', 'mujer', 'militar']))).toEqual([]);
  });

  it('skips forms the dictionary already has, irregular verbs and one-syllable ones', () => {
    const words = new Set(['tener', 'teniendo', 'tenés', 'ser', 'siendo', 'dar', 'dando']);
    expect(voseoForms(words)).toEqual(['tené']);
  });

  it('handles accented infinitives', () => {
    expect(voseoForms(new Set(['reír', 'reía']))).toEqual(['reís', 'reí']);
  });
});
