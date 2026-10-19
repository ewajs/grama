import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from './settings';

function memoryStorage(initial: Record<string, string> = {}) {
  const items = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
  };
}

describe('settings', () => {
  it('start with the defaults', () => {
    expect(loadSettings(memoryStorage())).toEqual(DEFAULT_SETTINGS);
  });

  it('restore what was saved', () => {
    const storage = memoryStorage();
    const settings = { theme: 'dark', vibration: false, tutorialSeen: true } as const;
    saveSettings(settings, storage);
    expect(loadSettings(storage)).toEqual(settings);
  });

  it('keep each understood setting and default the rest', () => {
    const saved = JSON.stringify({ theme: 'sepia', vibration: false });
    expect(loadSettings(memoryStorage({ 'grama.settings': saved }))).toEqual({
      ...DEFAULT_SETTINGS,
      vibration: false,
    });
  });

  it('fall back to the defaults when storage is unreadable', () => {
    expect(loadSettings(memoryStorage({ 'grama.settings': '{oops' }))).toEqual(DEFAULT_SETTINGS);
  });
});
