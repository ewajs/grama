/**
 * Checking for a new version of the app.
 * @module
 */

/** What checking for a new version found. */
export type UpdateCheck = 'available' | 'current' | 'offline' | 'unsupported';

/**
 * Asks the service worker to look for a new version right away (it also checks on its
 * own). If there is one, the update prompt appears as usual (`UpdatePrompt`).
 */
export async function checkForUpdate(): Promise<UpdateCheck> {
  const registration = await navigator.serviceWorker?.getRegistration();
  if (!registration) return 'unsupported';
  try {
    await registration.update();
  } catch {
    return 'offline';
  }
  return registration.installing || registration.waiting ? 'available' : 'current';
}
