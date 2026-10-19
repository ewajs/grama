import { expect, test } from '@playwright/test';
import { enterGame, openGame } from './app.ts';

test.use({ storageState: { cookies: [], origins: [] } });

test('a first launch shows the tutorial, once', async ({ page }) => {
  await openGame(page);
  const tutorial = page.getByRole('dialog', { name: 'Uní las letras' });
  await expect(tutorial).toBeVisible();
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await expect(page.getByRole('dialog', { name: 'Completá el tablero' })).toBeVisible();
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.getByRole('button', { name: '¡A jugar!' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await page.reload();
  await enterGame(page);
  await page.locator('[data-letter]').first().waitFor();
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('the menu shows the tutorial again', async ({ page }) => {
  await openGame(page);
  await page.getByRole('button', { name: 'Saltear' }).click();
  await page.getByRole('button', { name: 'Abrir el menú' }).click();
  await page.getByRole('button', { name: 'Cómo jugar' }).click();
  await expect(page.getByRole('dialog', { name: 'Uní las letras' })).toBeVisible();
});
