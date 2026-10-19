import { expect, test } from '@playwright/test';
import { level, nonWord } from './level.ts';
import { drawWord } from './wheel.ts';

const first = level(1);
const target = first.targets[0]!;

test('spelling a target word on the wheel scores it', async ({ page }) => {
  await page.goto('./');
  await drawWord(page, target);
  await expect(page.getByLabel('Puntos')).toHaveText(String(target.length * 10));
});

test('spelling a word that is not in the level scores nothing', async ({ page }) => {
  await page.goto('./');
  await drawWord(page, nonWord(first));
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
  await drawWord(page, target);
  await expect(page.getByLabel('Puntos')).toHaveText(String(target.length * 10));
});

test('finding every target completes the level and moves on to the next', async ({ page }) => {
  await page.goto('./');
  for (const word of first.targets) await drawWord(page, word);
  const points = first.targets.reduce((sum, word) => sum + word.length * 10, 0);
  await expect(page.getByRole('dialog')).toContainText('¡Bien ahí!');
  await expect(page.getByRole('dialog')).toContainText(`+${points} puntos`);
  await page.getByRole('button', { name: 'Siguiente nivel' }).click();
  await expect(page.getByText('Nivel 2')).toBeVisible();
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('progress survives a reload', async ({ page }) => {
  await page.goto('./');
  await drawWord(page, target);
  await expect(page.getByLabel('Puntos')).toHaveText(String(target.length * 10));
  await page.reload();
  await expect(page.getByLabel('Puntos')).toHaveText(String(target.length * 10));
  await expect(page.locator('.row', { hasText: [...target].join('') })).toBeVisible();
});
