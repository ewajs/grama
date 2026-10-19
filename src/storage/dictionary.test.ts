import { expect, it } from 'vitest';
import { NEW_DICTIONARY } from '../core/dictionary';
import { loadDictionary, saveDictionary } from './dictionary';

/** An in-memory stand-in for `localStorage`. */
function memoryStorage(initial: Record<string, string> = {}) {
  const items = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
  };
}

it('restores what was saved', () => {
  const storage = memoryStorage();
  saveDictionary(['SOL', 'ÑANDU'], storage);
  expect(loadDictionary(storage)).toEqual(['SOL', 'ÑANDU']);
});

it('starts empty when there is none, or it can’t be read', () => {
  expect(loadDictionary(memoryStorage())).toEqual(NEW_DICTIONARY);
  expect(loadDictionary(memoryStorage({ 'grama.words': '{oops' }))).toEqual(NEW_DICTIONARY);
  const odd = JSON.stringify(['SOL', 3]);
  expect(loadDictionary(memoryStorage({ 'grama.words': odd }))).toEqual(NEW_DICTIONARY);
});
