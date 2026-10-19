import { expect, test } from '@playwright/test';
import { drawWord } from './wheel.ts';

test('spelling a target word on the wheel scores it', async ({ page }) => {
  await page.goto('./');
  await drawWord(page, 'SOL');
  await expect(page.getByLabel('Puntos')).toHaveText('30');
});

test('spelling a word that is not in the level scores nothing', async ({ page }) => {
  await page.goto('./');
  await drawWord(page, 'LOT');
  await expect(page.getByLabel('Puntos')).toHaveText('0');
});

test('letters can still be dragged after shuffling', async ({ page }) => {
  await page.goto('./');
  const order = () =>
    page.locator('[data-letter]').evaluateAll((els) => els.map((e) => e.textContent));
  const before = await order();
  await page.getByRole('button', { name: 'Mezclar letras' }).click();
  expect(await order()).not.toEqual(before);
  await page.waitForTimeout(400); // let the letters glide into place
  await drawWord(page, 'SOL');
  await expect(page.getByLabel('Puntos')).toHaveText('30');
});

test('finding every target completes the level and moves on to the next', async ({ page }) => {
  await page.goto('./');
  // Level 1's targets, from src/content/es/levels.ts.
  for (const word of ['SOL', 'SAL', 'PATO', 'SOPA', 'ALTO', 'PLATO', 'SALTO', 'PLATOS']) {
    await drawWord(page, word);
  }
  await expect(page.getByRole('dialog')).toContainText('¡Bien ahí!');
  await expect(page.getByRole('dialog')).toContainText('+340 puntos');
  await page.getByRole('button', { name: 'Siguiente nivel' }).click();
  await expect(page.getByText('Nivel 2')).toBeVisible();
  await expect(page.getByRole('dialog')).toBeHidden();
});
