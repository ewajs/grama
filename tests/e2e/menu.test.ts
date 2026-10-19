import { expect, test } from '@playwright/test';
import { level } from './level.ts';
import { drawWord } from './wheel.ts';

const openMenu = (page: import('@playwright/test').Page) =>
  page.getByRole('button', { name: 'Abrir el menú' }).click();

test('the chosen theme applies and survives a reload', async ({ page }) => {
  await page.goto('./');
  await openMenu(page);
  await page.getByRole('radio', { name: 'Oscuro' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await openMenu(page);
  await page.getByRole('radio', { name: 'Automático' }).click();
  await expect(page.locator('html')).not.toHaveAttribute('data-theme');
});

test('starting over goes back to level 1 with no points', async ({ page }) => {
  const target = level(5).targets[0]!;
  await page.goto('./?nivel=5');
  await drawWord(page, target);
  await expect(page.getByLabel('Puntos')).not.toHaveText('0');
  await openMenu(page);
  await page.getByRole('button', { name: 'Empezar de cero' }).click();
  await page.getByRole('button', { name: 'Sí, empezar de cero' }).click();
  await expect(page.getByText('Nivel 1', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Puntos')).toHaveText('0');
});
