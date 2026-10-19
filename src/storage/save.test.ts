import { describe, expect, it } from 'vitest';
import { NEW_GAME, type GameState } from '../core/game';
import { loadGame, saveGame } from './save';

/** An in-memory stand-in for `localStorage`. */
function memoryStorage(initial: Record<string, string> = {}) {
  const items = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
  };
}

const state: GameState = { ...NEW_GAME, levelNumber: 12, score: 480, found: ['CASA', 'SOL'] };

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
    const old = JSON.stringify({ version: 0, state });
    expect(loadGame(memoryStorage({ 'grama.save': old }))).toBeNull();
    const broken = JSON.stringify({ version: 3, state: { levelNumber: 'x' } });
    expect(loadGame(memoryStorage({ 'grama.save': broken }))).toBeNull();
    expect(loadGame(memoryStorage({ 'grama.save': '{not json' }))).toBeNull();
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
