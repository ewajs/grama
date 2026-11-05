import { expect, it } from 'vitest';
import { NEW_PROGRESS } from '../core/progress';
import { readProfile, replaceProfile } from './profile';
import { loadGame, saveGame } from './save';

it('preserves the exact versioned save and other profile values without including unrelated storage', () => {
  const values = new Map([
    ['grama.settings', '{"theme":"yerba","sound":false}'],
    ['grama.words', '["ÁRBOL","TENÉS"]'],
    ['grama.trials', '{"runs":3,"best":{"points":50,"cleared":0,"words":1},"mostCleared":0}'],
    ['grama.assessment-gap', '1'],
    ['another-app', 'private'],
  ]);
  const progress = { ...NEW_PROGRESS, levelNumber: 12, score: 1234, hints: 9 };
  saveGame(progress, { setItem: (key, value) => values.set(key, value) });
  const profile = readProfile({ getItem: (key) => values.get(key) ?? null });
  expect(profile).toEqual(Object.fromEntries([...values].filter(([key]) => key !== 'another-app')));
  expect(loadGame({ getItem: (key) => profile[key as keyof typeof profile] })).toEqual(progress);
});

it('keeps absent values distinct from defaults and preserves unrecognized saved bytes', () => {
  const profile = readProfile({ getItem: (key) => (key === 'grama.save' ? '{old save' : null) });
  expect(profile['grama.save']).toBe('{old save');
  expect(profile['grama.words']).toBeNull();
});

it('fails instead of replacing unreadable profile data with defaults', () => {
  expect(() =>
    readProfile({
      getItem: () => {
        throw new Error('Storage blocked');
      },
    }),
  ).toThrow('Storage blocked');
});

it('replaces and undoes a profile while preserving other same-origin applications', () => {
  const saved = new Map([
    ['grama.save', 'old'],
    ['other-app', 'untouched'],
  ]);
  const storage = {
    getItem: (k: string) => saved.get(k) ?? null,
    setItem: (k: string, v: string) => {
      saved.set(k, v);
    },
    removeItem: (k: string) => {
      saved.delete(k);
    },
  };
  const before = readProfile(storage),
    next = { ...before, 'grama.save': null, 'grama.words': '["SAL"]' };
  const undo = replaceProfile(next, storage);
  expect(readProfile(storage)).toEqual(next);
  expect(saved.get('other-app')).toBe('untouched');
  undo();
  expect(readProfile(storage)).toEqual(before);
});

it('rolls back a partial profile write when a value cannot be stored', () => {
  const saved = new Map([['grama.save', 'old']]);
  const storage = {
    getItem: (k: string) => saved.get(k) ?? null,
    setItem: (k: string, v: string) => {
      if (v === 'too-large') throw new Error('Quota');
      saved.set(k, v);
    },
    removeItem: (k: string) => {
      saved.delete(k);
    },
  };
  const before = readProfile(storage);
  expect(() =>
    replaceProfile({ ...before, 'grama.save': 'new', 'grama.words': 'too-large' }, storage),
  ).toThrow('Quota');
  expect(readProfile(storage)).toEqual(before);
});
