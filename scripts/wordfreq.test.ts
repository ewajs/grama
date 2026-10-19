import { expect, it } from 'vitest';
import { rankedWords } from './wordfreq.ts';

it('flattens the frequency buckets in order, skipping the header', () => {
  const decoded = [{ format: 'cB', version: 1 }, ['de', 'la'], [], ['casa'], ['mate', 'che']];
  expect(rankedWords(decoded)).toEqual(['de', 'la', 'casa', 'mate', 'che']);
});
