/** How the app can be installed on this device, if at all. */
export type InstallOption =
  /** The browser offers its own install prompt (Chrome, Edge, Android). */
  | 'prompt'
  /** iOS: only by hand, from Safari's Share menu. */
  | 'ios'
  /** Already running as an installed app, or no way to install it here. */
  | 'none';

/**
 * Which install option to offer, from what the device says about itself.
 * @param device `installed`: already running as an app; `canPrompt`: the browser has
 * offered its install prompt; `ios`: an iPhone or iPad.
 */
export function installOption(device: {
  installed: boolean;
  canPrompt: boolean;
  ios: boolean;
}): InstallOption {
  if (device.installed) return 'none';
  if (device.canPrompt) return 'prompt';
  return device.ios ? 'ios' : 'none';
}

const isInstalled = () =>
  matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

// iPads present themselves as Macs, but Macs have no touch screen.
const isIos = () =>
  /iPhone|iPad|iPod/.test(navigator.userAgent) ||
  (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1);

/**
 * Installing the app as a home-screen app. Create it once, early: the browser offers its
 * install prompt only once per page load, soon after it starts.
 */
export class Installer {
  #prompt = $state<BeforeInstallPromptEvent | null>(null);
  #installed = $state(isInstalled());

  constructor() {
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault(); // We offer it from the menu instead of the browser's banner.
      this.#prompt = event;
    });
    window.addEventListener('appinstalled', () => {
      this.#installed = true;
      this.#prompt = null;
    });
  }

  /** What to offer the player. */
  get option(): InstallOption {
    return installOption({ installed: this.#installed, canPrompt: !!this.#prompt, ios: isIos() });
  }

  /** Shows the browser's install prompt, when it offers one. */
  async install(): Promise<void> {
    const prompt = this.#prompt;
    if (!prompt) return;
    await prompt.prompt();
    // The browser allows each prompt only once, whatever the answer.
    this.#prompt = null;
  }
}
