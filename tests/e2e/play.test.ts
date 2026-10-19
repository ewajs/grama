import { expect, test } from '@playwright/test';
import { level, nonWord, written } from './level.ts';
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
  // No hints and no bonus words: two stars.
  await expect(page.getByRole('img', { name: '2 estrellas' })).toBeVisible();
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

test('a hint reveals a letter on the board', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Pista: te quedan 3' }).click();
  await expect(page.locator('.hinted')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Pista: te quedan 2' })).toBeVisible();
});

test('tapping the bonus counter lists the bonus words found', async ({ page }) => {
  const bonus = first.bonus[0]!;
  await page.goto('./');
  await drawWord(page, bonus);
  await page.getByRole('button', { name: /^Palabras extra: 1/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Palabras extra' });
  await expect(dialog).toContainText(written(bonus));
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('the report button links to a pre-filled GitHub issue', async ({ page }) => {
  await page.goto('./');
  await drawWord(page, nonWord(first));
  await page.getByRole('button', { name: 'Abrir el menú' }).click();
  await page.getByRole('button', { name: 'Reportar un problema' }).click();
  const link = page.getByRole('link', { name: 'Falta una palabra' });
  const url = new URL((await link.getAttribute('href'))!);
  expect(url.origin + url.pathname).toBe('https://github.com/ewajs/grama/issues/new');
  expect(url.searchParams.get('title')).toBe('Falta una palabra (nivel 1)');
  expect(url.searchParams.get('body')).toContain(`Intentos rechazados: ${nonWord(first)}`);
});

test('the shuffled order stays put while playing', async ({ page }) => {
  const order = () =>
    page.locator('[data-letter]').evaluateAll((els) => els.map((e) => e.textContent?.trim()));
  await page.goto('./');
  await page.locator('[data-letter]').first().waitFor();
  await page.getByRole('button', { name: 'Mezclar letras' }).click();
  await page.waitForTimeout(400);
  const shuffledOrder = await order();
  await drawWord(page, target);
  await expect(page.getByLabel('Puntos')).not.toHaveText('0');
  expect(await order()).toEqual(shuffledOrder);
  await drawWord(page, first.bonus[0]!);
  expect(await order()).toEqual(shuffledOrder);
  await page.getByRole('button', { name: /^Pista/ }).click();
  expect(await order()).toEqual(shuffledOrder);
});
