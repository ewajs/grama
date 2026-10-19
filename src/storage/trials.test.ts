import { expect, it } from 'vitest';
import { NEW_TRIAL_RECORD } from '../core/time-trial';
import { loadTrials, saveTrials } from './trials';

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
  const record = { runs: 3, best: { points: 420, cleared: 4, words: 18 }, mostCleared: 5 };
  saveTrials(record, storage);
  expect(loadTrials(storage)).toEqual(record);
});

it('starts a new record when there is none, or it can’t be read', () => {
  expect(loadTrials(memoryStorage())).toEqual(NEW_TRIAL_RECORD);
  expect(loadTrials(memoryStorage({ 'grama.trials': '{oops' }))).toEqual(NEW_TRIAL_RECORD);
  const odd = JSON.stringify({ runs: 'many', best: null, mostCleared: 0 });
  expect(loadTrials(memoryStorage({ 'grama.trials': odd }))).toEqual(NEW_TRIAL_RECORD);
});
