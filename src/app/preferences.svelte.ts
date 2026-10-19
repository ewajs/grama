import type { Settings, Theme } from '../storage/settings';

/**
 * The player's settings, reactive for the UI. Assigning one (`preferences.theme =
 * 'dark'`, or `bind:value`) updates the screen and calls `onchange`, e.g. to save.
 */
export class Preferences {
  #settings: Settings;
  #onchange: (settings: Settings) => void;

  /**
   * @param settings The settings to start with (from `loadSettings`).
   * @param onchange Called with the new settings after every change.
   */
  constructor(settings: Settings, onchange: (settings: Settings) => void = () => {}) {
    this.#settings = $state(settings);
    this.#onchange = onchange;
  }

  /** Light or dark colors, or following the device. */
  get theme(): Theme {
    return this.#settings.theme;
  }
  set theme(theme: Theme) {
    this.#update({ theme });
  }

  /** Whether to vibrate on touch. */
  get vibration(): boolean {
    return this.#settings.vibration;
  }
  set vibration(vibration: boolean) {
    this.#update({ vibration });
  }

  /** Whether the tutorial has been shown. */
  get tutorialSeen(): boolean {
    return this.#settings.tutorialSeen;
  }
  set tutorialSeen(tutorialSeen: boolean) {
    this.#update({ tutorialSeen });
  }

  #update(change: Partial<Settings>) {
    this.#settings = { ...this.#settings, ...change };
    this.#onchange(this.#settings);
  }
}
