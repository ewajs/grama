import { expect, test } from '@playwright/test';

test('the app opens on the home screen, at level 1', async ({ page }) => {
  await page.goto('./');
  await expect(page).toHaveTitle('Grama');
  await expect(page.getByRole('button', { name: /^Jugar.*Nivel 1/ })).toBeVisible();
});

test('Jugar opens the game, and back returns home', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: /^Jugar/ }).click();
  await page.locator('[data-letter]').first().waitFor();
  await page.goBack();
  await expect(page.getByRole('button', { name: /^Jugar/ })).toBeVisible();
  await page.getByRole('button', { name: /^Jugar/ }).click();
  await page.getByRole('button', { name: 'Volver al inicio' }).click();
  await expect(page.getByRole('button', { name: /^Jugar/ })).toBeVisible();
});

test('?nivel= opens that level', async ({ page }) => {
  await page.goto('./?nivel=37');
  await expect(page.getByText('Nivel 37')).toBeVisible();
  // …and leaves the URL, so a reload continues from the saved game.
  await expect(page).toHaveURL(/\/grama\/$/);
});
