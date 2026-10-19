import { expect, test } from '@playwright/test';
import { todaysDaily } from './level.ts';
import { drawWord } from './wheel.ts';

test("today's daily challenge can be played, shared and starts a streak", async ({ page }) => {
  // Stands in for the phone's share sheet, keeping what was shared.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', {
      value: async ({ text }: { text: string }) => {
        (window as unknown as { shared: string }).shared = text;
      },
    });
  });
  const { level, number } = todaysDaily();
  await page.goto('./');
  await page.getByRole('button', { name: /^Desafío del día/ }).click();
  await expect(page.getByText(`Desafío #${number}`, { exact: true })).toBeVisible();

  for (const word of level.targets) await drawWord(page, word);
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText(`Completaste el desafío #${number}`);
  await dialog.getByRole('button', { name: 'Compartir' }).click();
  const shared = await page.evaluate(() => (window as unknown as { shared: string }).shared);
  expect(shared).toContain(`Grama #${number}`);
  expect(shared).toContain('★★');

  await dialog.getByRole('button', { name: 'Volver al inicio' }).click();
  await expect(page.getByRole('button', { name: /^Desafío del día.*🔥 1/ })).toBeVisible();
  // The main game didn't move.
  await expect(page.getByRole('button', { name: /^Jugar.*Nivel 1/ })).toBeVisible();
});
