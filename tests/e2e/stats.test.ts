import { expect, test } from '@playwright/test';
import { openGame } from './app.ts';
import { level } from './level.ts';
import { drawWord } from './wheel.ts';

test('completing a level earns an achievement and counts in the stats', async ({ page }) => {
  const first = level(1);
  await openGame(page);
  for (const word of first.targets) await drawWord(page, word);
  await expect(page.getByRole('status').filter({ hasText: 'Primer paso' })).toBeVisible();
  await page.getByRole('button', { name: 'Siguiente nivel' }).click();
  await page.getByRole('button', { name: 'Volver al inicio' }).click();
  await expect(page.getByRole('button', { name: /^Logros.*1 de 15/ })).toBeVisible();
  await page.getByRole('button', { name: /^Logros/ }).click();
  const total = (label: string) =>
    page.locator('dl div', { has: page.getByText(label, { exact: true }) });
  await expect(total('Niveles').locator('dd')).toHaveText('1');
  await expect(total('Palabras').locator('dd')).toHaveText(String(first.targets.length));
});
