import type { Page } from '@playwright/test';

/** From the home screen into the game. */
export async function enterGame(page: Page): Promise<void> {
  await page.getByRole('button', { name: /^Jugar/ }).click();
}

/** Opens the app and goes from the home screen into the game. */
export async function openGame(page: Page): Promise<void> {
  await page.goto('./');
  await enterGame(page);
}
