import { expect, it } from 'vitest';
import { NEW_PROGRESS } from '../../core/progress';
import { readProfile } from '../../storage/profile';
import { saveGame } from '../../storage/save';
import { historyFile, type GramaSnapshot } from './export';
import { parseProfileImport } from './import';

function file() {
  const saved = new Map<string, string>([['grama.words', '["SAL","SOL"]']]);
  saveGame(
    { ...NEW_PROGRESS, levelNumber: 12, score: 1234 },
    { setItem: (k, v) => saved.set(k, v) },
  );
  const profile = readProfile({ getItem: (k) => saved.get(k) ?? null });
  const snapshot: GramaSnapshot = {
    version: 2,
    records: [],
    checkpoints: [],
    exposures: [],
    sequence: 0,
  };
  return JSON.parse(
    historyFile(snapshot, profile, { version: '0.23.0', build: 'test', at: 0 }).content,
  );
}

it('previews the complete export without applying its supplied model settings', () => {
  const source = file();
  source.model = { prior: { rating: 9999999 } };
  const parsed = parseProfileImport(JSON.stringify(source));
  expect(parsed?.summary).toEqual({ level: 12, points: 1234, words: 2, matches: 0 });
  expect(parsed?.profile).toEqual(source.profile);
  expect(parsed).not.toHaveProperty('model');
});

it.each([
  (f: ReturnType<typeof file>) => {
    f.version = 1;
  },
  (f: ReturnType<typeof file>) => {
    f.version = 3;
  },
  (f: ReturnType<typeof file>) => {
    delete f.profile['grama.words'];
  },
  (f: ReturnType<typeof file>) => {
    f.profile['other-app'] = 'foreign';
  },
  (f: ReturnType<typeof file>) => {
    f.profile['grama.save'] = '{broken';
  },
  (f: ReturnType<typeof file>) => {
    f.profile['grama.settings'] = '{"theme":"unknown"}';
  },
  (f: ReturnType<typeof file>) => {
    f.profile['grama.words'] = '{"not":"a dictionary"}';
  },
  (f: ReturnType<typeof file>) => {
    f.profile['grama.trials'] = '{"runs":-1,"best":null,"mostCleared":0}';
  },
  (f: ReturnType<typeof file>) => {
    f.assessment.sequence = -1;
  },
  (f: ReturnType<typeof file>) => {
    f.assessment.version = 999;
  },
])('rejects incomplete, incompatible or malformed files before writing (%#)', (change) => {
  const source = file();
  change(source);
  expect(parseProfileImport(JSON.stringify(source))).toBeNull();
});

it('accepts an untouched fresh profile and rejects malformed JSON', () => {
  const source = file();
  for (const key of Object.keys(source.profile)) source.profile[key] = null;
  expect(parseProfileImport(JSON.stringify(source))?.summary).toEqual({
    level: 1,
    points: 0,
    words: 0,
    matches: 0,
  });
  expect(parseProfileImport('{')).toBeNull();
});
