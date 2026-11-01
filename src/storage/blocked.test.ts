import { expect, it } from 'vitest';
import { NEW_PROGRESS } from '../core/progress';
import { NEW_TRIAL_RECORD } from '../core/time-trial';
import { loadDictionary, saveDictionary } from './dictionary';
import { loadGame, saveGame } from './save';
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from './settings';
import { loadTrials, saveTrials } from './trials';

it('keeps working when accessing localStorage itself is blocked', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() {
      throw new Error('SecurityError');
    },
  });
  try {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
    expect(loadGame()).toBeNull();
    expect(loadTrials()).toEqual(NEW_TRIAL_RECORD);
    expect(loadDictionary()).toEqual([]);
    expect(() => saveSettings(DEFAULT_SETTINGS)).not.toThrow();
    expect(() => saveGame(NEW_PROGRESS)).not.toThrow();
    expect(() => saveTrials(NEW_TRIAL_RECORD)).not.toThrow();
    expect(() => saveDictionary(['SOL'])).not.toThrow();
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
});
