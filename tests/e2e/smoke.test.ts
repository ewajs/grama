import { expect, test } from '@playwright/test';

test('the app loads on the first level', async ({ page }) => {
  await page.goto('./');
  await expect(page).toHaveTitle('Grama');
  await expect(page.getByText('Nivel 1')).toBeVisible();
});

test('?nivel= opens that level', async ({ page }) => {
  await page.goto('./?nivel=37');
  await expect(page.getByText('Nivel 37')).toBeVisible();
  // …and leaves the URL, so a reload continues from the saved game.
  await expect(page).toHaveURL(/\/grama\/$/);
});
