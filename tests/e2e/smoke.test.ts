import { expect, test } from '@playwright/test';
import { todaysDaily } from './level.ts';

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

test('app shortcuts (?ir=) open their place, and back returns home', async ({ page }) => {
  await page.goto('./?ir=desafio');
  await expect(page.getByText(`Desafío #${todaysDaily().number}`)).toBeVisible();
  await expect(page).toHaveURL(/\/grama\/$/);
  await page.goBack();
  await expect(page.getByRole('button', { name: /^Jugar/ })).toBeVisible();

  await page.goto('./?ir=contrarreloj');
  await expect(page.getByRole('timer')).toBeVisible();
  await page.goto('./?ir=diccionario');
  await expect(page.getByRole('heading', { name: 'Tu diccionario' })).toBeVisible();
});

test('home shows before the words arrive; a level waits for them', async ({ page }) => {
  let release = () => {};
  const held = new Promise<void>((resolve) => (release = resolve));
  await page.route('**/dictionary-*.txt', async (route) => {
    await held;
    await route.continue();
  });
  await page.goto('./');
  await expect(page.getByRole('button', { name: /^Jugar.*Nivel 1/ })).toBeVisible();
  await page.getByRole('button', { name: /^Jugar/ }).click();
  await expect(page.getByText('Cargando palabras…')).toBeVisible();
  release();
  await expect(page.locator('[data-letter]').first()).toBeVisible();
});
