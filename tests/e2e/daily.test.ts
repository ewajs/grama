import { expect, test } from '@playwright/test';
import { dateKey } from '../../src/core/daily';
import type { LevelRecord } from '../../src/core/history';
import { NEW_PROGRESS } from '../../src/core/progress';
import { saveGame } from '../../src/storage/save';
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

test('seven days in a row earn a streak freeze, shown on the home screen', async ({ page }) => {
  const record: LevelRecord = {
    tier: 'easy',
    difficulty: 'normal',
    occurrence: 0,
    stars: 2,
    hints: 0,
    bonus: 0,
    targets: 8,
  };
  const dailies: Record<string, LevelRecord> = {};
  for (let back = 1; back <= 7; back++) {
    const date = new Date();
    date.setDate(date.getDate() - back);
    dailies[dateKey(date)] = record;
  }
  let saved = '';
  saveGame({ ...NEW_PROGRESS, dailies }, { setItem: (_key, value) => (saved = value) });
  await page.addInitScript((save) => localStorage.setItem('grama.save', save), saved);
  await page.goto('./');
  const daily = page.getByRole('button', { name: /^Desafío del día/ });
  await expect(daily).toContainText('🔥 7');
  await expect(daily.getByRole('img', { name: /Racha protegida/ })).toBeVisible();
});
