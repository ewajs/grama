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
