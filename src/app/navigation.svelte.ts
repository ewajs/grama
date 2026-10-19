/**
 * Which screen shows, tied to the browser's history so "back" works.
 * @module
 */

/** The app's screens. */
export type Screen = 'home' | 'game' | 'map' | 'stats' | 'trial';

/**
 * Which screen shows. Moving to a screen adds a browser history entry, so the back
 * gesture or button returns to the previous one; it never leaves the app's start screen.
 */
export class Navigation {
  #screen = $state<Screen>('home');

  /** @param start The screen to open on. */
  constructor(start: Screen = 'home') {
    history.replaceState({ screen: 'home' }, '');
    if (start !== 'home') this.go(start);
    window.addEventListener('popstate', (event) => {
      const screen: unknown = event.state?.screen;
      const screens: unknown[] = ['game', 'map', 'stats', 'trial'];
      this.#screen = screens.includes(screen) ? (screen as Screen) : 'home';
    });
  }

  /** The screen showing. */
  get screen(): Screen {
    return this.#screen;
  }

  /** Shows a screen, remembering the current one for "back". */
  go(screen: Screen): void {
    history.pushState({ screen }, '');
    this.#screen = screen;
  }

  /** Back to the previous screen. */
  back(): void {
    history.back();
  }
}
