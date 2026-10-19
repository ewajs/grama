/** The app's screens. */
export type Screen = 'home' | 'game';

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
      this.#screen = screen === 'game' ? screen : 'home';
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
