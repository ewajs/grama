/** Short commit id of the build (set in vite.config.ts), so reports name the version. */
declare const __BUILD__: string;

/** Chrome's event for offering to install the app (not in TypeScript's DOM types yet). */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface WindowEventMap {
  beforeinstallprompt: BeforeInstallPromptEvent;
}

interface Navigator {
  /** iOS Safari: whether the page runs as an app added to the home screen. */
  readonly standalone?: boolean;
}
