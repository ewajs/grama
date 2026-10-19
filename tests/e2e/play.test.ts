import { expect, test } from '@playwright/test';
import { drawWord } from './wheel.ts';

test('spelling a target word on the wheel scores it', async ({ page }) => {
  await page.goto('./');
  await drawWord(page, 'SOL');
  await expect(page.getByLabel('Puntos')).toHaveText('★ 30');
});

test('spelling a word that is not in the level scores nothing', async ({ page }) => {
  await page.goto('./');
  await drawWord(page, 'LOT');
  await expect(page.getByLabel('Puntos')).toHaveText('★ 0');
});
