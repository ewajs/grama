import { describe, expect, it } from 'vitest';
import { NEW_PROGRESS, type Progress } from '../core/progress';
import { NEW_SESSION } from '../core/session';
import { loadGame, saveGame } from './save';

/** An in-memory stand-in for `localStorage`. */
function memoryStorage(initial: Record<string, string> = {}) {
  const items = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
  };
}

const state: Progress = {
  ...NEW_PROGRESS,
  levelNumber: 12,
  score: 480,
  session: { ...NEW_SESSION, found: ['CASA', 'SOL'], revealed: {} },
};

describe('saving and loading', () => {
  it('restores what was saved', () => {
    const storage = memoryStorage();
    saveGame(state, storage);
    expect(loadGame(storage)).toEqual(state);
  });

  it('finds nothing when nothing was saved', () => {
    expect(loadGame(memoryStorage())).toBeNull();
  });

  it('discards saves from another version or with an unexpected shape', () => {
    const old = JSON.stringify({ version: 0, progress: state });
    expect(loadGame(memoryStorage({ 'grama.save': old }))).toBeNull();
    const broken = JSON.stringify({ version: 7, progress: { levelNumber: 'x' } });
    expect(loadGame(memoryStorage({ 'grama.save': broken }))).toBeNull();
    expect(loadGame(memoryStorage({ 'grama.save': '{not json' }))).toBeNull();
  });

  it('keeps the progress but starts the levels in play over when the levels changed', () => {
    const storage = memoryStorage();
    const playing = { ...state, daily: { date: '2026-10-19', session: state.session } };
    saveGame(playing, storage);
    const saved = JSON.parse(storage.getItem('grama.save') ?? '');
    storage.setItem('grama.save', JSON.stringify({ ...saved, levels: saved.levels - 1 }));
    expect(loadGame(storage)).toEqual({
      ...playing,
      session: NEW_SESSION,
      daily: { date: '2026-10-19', session: NEW_SESSION },
    });
  });

  it('goes on quietly when storage is blocked', () => {
    const blocked = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    };
    expect(() => saveGame(state, blocked)).not.toThrow();
    expect(loadGame(blocked)).toBeNull();
  });
});

describe('save validation', () => {
  const record = {
    tier: 'easy',
    difficulty: 'normal',
    occurrence: 0,
    stars: 2,
    hints: 0,
    bonus: 0,
    targets: 5,
  };
  it('restores nested sessions, records and occurrence counts', () => {
    const storage = memoryStorage();
    const progress = {
      ...state,
      occurrences: { 'easy:6': 2 },
      history: { 1: record },
      daily: { date: '2026-10-19', session: state.session },
      dailies: { '2026-10-19': record },
    } as Progress;
    saveGame(progress, storage);
    expect(loadGame(storage)).toEqual(progress);
  });

  it.each([
    { history: { 1: null } },
    { history: { 1: { ...record, stars: 4 } } },
    { history: { 1: { ...record, occurrence: -1 } } },
    { dailies: { 'not-a-date': record } },
    { dailies: { '2026-02-30': record } },
    { dailies: { '2026-10-19': { ...record, tier: 'unknown' } } },
    { occurrences: { 'easy:6': 'two' } },
    { occurrences: [] },
    { session: { ...NEW_SESSION, revealed: { CASA: -1 } } },
    { session: { ...NEW_SESSION, hintsWon: undefined } },
    { daily: { date: '2026-10-19', session: { found: [] } } },
    { daily: { date: '2026-10-19', session: { ...NEW_SESSION, found: [null] } } },
    { hints: -1 },
    { bonusTowardHint: 10 },
    { score: -1 },
  ])('rejects malformed progress: %j', (changes) => {
    const storage = memoryStorage();
    saveGame(state, storage);
    const saved = JSON.parse(storage.getItem('grama.save') ?? '');
    saved.progress = { ...saved.progress, ...changes };
    storage.setItem('grama.save', JSON.stringify(saved));
    expect(loadGame(storage)).toBeNull();
  });
});
