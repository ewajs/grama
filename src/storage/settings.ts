import type { Difficulty } from '../core/cadence';

/** Light or dark colors: following the device, or the player's pick. */
export type Theme = 'auto' | 'light' | 'dark';

/** The player's options, saved apart from their progress. */
export type Settings = {
  theme: Theme;
  /** How hard the levels are, from the next one on. */
  difficulty: Difficulty;
  /** Vibrate on touch, where the device can. */
  vibration: boolean;
  /** Whether the "Cómo jugar" tutorial has been shown. */
  tutorialSeen: boolean;
};

/** Settings for a first launch. */
export const DEFAULT_SETTINGS: Settings = {
  theme: 'auto',
  difficulty: 'normal',
  vibration: true,
  tutorialSeen: false,
};

const KEY = 'grama.settings';

/**
 * The saved settings. Each one that's missing or not understood takes its default, so a
 * new option never wipes the others.
 * @param storage Where settings live; `localStorage` unless a test passes another.
 */
export function loadSettings(storage: Pick<Storage, 'getItem'> = localStorage): Settings {
  let saved: Record<string, unknown> = {};
  try {
    const parsed: unknown = JSON.parse(storage.getItem(KEY) ?? '{}');
    if (typeof parsed === 'object' && parsed !== null) saved = parsed as Record<string, unknown>;
  } catch {
    // Unreadable or blocked: defaults it is.
  }
  const { theme, difficulty, vibration, tutorialSeen } = saved;
  return {
    theme: theme === 'light' || theme === 'dark' ? theme : DEFAULT_SETTINGS.theme,
    difficulty:
      difficulty === 'relaxed' || difficulty === 'challenging'
        ? difficulty
        : DEFAULT_SETTINGS.difficulty,
    vibration: typeof vibration === 'boolean' ? vibration : DEFAULT_SETTINGS.vibration,
    tutorialSeen: typeof tutorialSeen === 'boolean' ? tutorialSeen : DEFAULT_SETTINGS.tutorialSeen,
  };
}

/**
 * Saves the settings. If storage is full or blocked they last until the page closes.
 * @param storage Where settings live; `localStorage` unless a test passes another.
 */
export function saveSettings(settings: Settings, storage: Pick<Storage, 'setItem'> = localStorage) {
  try {
    storage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // Not worth interrupting the player over.
  }
}
