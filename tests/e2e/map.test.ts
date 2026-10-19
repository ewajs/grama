import { expect, test } from '@playwright/test';
import { openGame } from './app.ts';
import { level } from './level.ts';
import { drawWord } from './wheel.ts';

test('the map shows completed levels and replays them without moving progress or paying', async ({
  page,
}) => {
  const first = level(1);
  await openGame(page);
  for (const word of first.targets) await drawWord(page, word);
  await page.getByRole('button', { name: 'Siguiente nivel' }).click();
  await page.getByRole('button', { name: 'Volver al inicio' }).click();

  await expect(page.getByRole('button', { name: /^Mapa.*1 nivel/ })).toBeVisible();
  await page.getByRole('button', { name: /^Mapa/ }).click();
  const levelOne = page.getByRole('button', { name: 'Jugar el nivel 1' });
  await expect(levelOne.getByRole('img', { name: '2 estrellas' })).toBeVisible();

  await levelOne.click();
  await expect(page.getByText('Repetición')).toBeVisible();
  for (const word of first.targets) await drawWord(page, word);
  await expect(page.getByText('Ya lo habías completado: no suma puntos')).toBeVisible();
  await page.getByRole('button', { name: 'Volver al mapa' }).click();
  await expect(page.getByRole('button', { name: 'Jugar el nivel 2' })).toBeVisible();

  await page.goBack();
  await expect(page.getByRole('button', { name: /^Jugar.*Nivel 2/ })).toBeVisible();
});
