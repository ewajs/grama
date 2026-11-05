import { expect, it } from 'vitest';
import { NEW_PROGRESS } from '../core/progress';
import { readProfile } from './profile';
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
