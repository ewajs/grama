import { describe, expect, it } from 'vitest';
import { collect, NEW_DICTIONARY } from './dictionary';

describe('collect', () => {
  it('adds new words at the end, each once', () => {
    expect(collect(['SOL'], ['SAL', 'SOL', 'PATO', 'SAL'])).toEqual(['SOL', 'SAL', 'PATO']);
  });

  it('returns the same dictionary when no word is new', () => {
    const dictionary = ['SOL', 'SAL'];
    expect(collect(dictionary, ['SAL'])).toBe(dictionary);
    expect(collect(NEW_DICTIONARY, [])).toBe(NEW_DICTIONARY);
  });

  it('leaves the dictionary it was given as it was', () => {
    const dictionary = ['SOL'];
    collect(dictionary, ['SAL']);
    expect(dictionary).toEqual(['SOL']);
  });
});
