/**
 * The player's settings as reactive state for the UI.
 * @module
 */

import type { Difficulty } from '../core/cadence';
import type { Mode, Settings, Theme } from '../storage/settings';

/**
 * The player's settings, reactive for the UI. Assigning one (`preferences.mode =
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

  /** The color theme. */
  get theme(): Theme {
    return this.#settings.theme;
  }
  /** Picks a color theme. */
  set theme(theme: Theme) {
    this.#update({ theme });
  }

  /** Light or dark colors, or following the device. */
  get mode(): Mode {
    return this.#settings.mode;
  }
  /** Picks light or dark colors, or following the device. */
  set mode(mode: Mode) {
    this.#update({ mode });
  }

  /** How hard levels are, from the next one on. */
  get difficulty(): Difficulty {
    return this.#settings.difficulty;
  }
  /** Picks how hard the next levels are. */
  set difficulty(difficulty: Difficulty) {
    this.#update({ difficulty });
  }

  /** Whether to vibrate on touch. */
  get vibration(): boolean {
    return this.#settings.vibration;
  }
  /** Turns vibration on or off. */
  set vibration(vibration: boolean) {
    this.#update({ vibration });
  }

  /** Whether to play sound effects. */
  get sound(): boolean {
    return this.#settings.sound;
  }
  /** Turns sound effects on or off. */
  set sound(sound: boolean) {
    this.#update({ sound });
  }

  /** Whether the tutorial has been shown. */
  get tutorialSeen(): boolean {
    return this.#settings.tutorialSeen;
  }
  /** Marks the tutorial as shown, or not. */
  set tutorialSeen(tutorialSeen: boolean) {
    this.#update({ tutorialSeen });
  }

  #update(change: Partial<Settings>) {
    this.#settings = { ...this.#settings, ...change };
    this.#onchange(this.#settings);
  }
}
