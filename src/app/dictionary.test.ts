import { expect, it } from 'vitest';
import { definitionUrl } from './dictionary';

it('links to the word in the RAE dictionary, lowercase with its accents', () => {
  expect(definitionUrl('ÁRBOL')).toBe('https://dle.rae.es/%C3%A1rbol');
  expect(definitionUrl('AÑO')).toBe('https://dle.rae.es/a%C3%B1o');
});
