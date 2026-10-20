import { expect, test } from '@playwright/test';
import { openGame } from './app.ts';
import { level, written } from './level.ts';
import { drawWord } from './wheel.ts';

test('words found land in Tu diccionario, searchable, and stay after a reload', async ({
  page,
}) => {
  const first = level(1);
  const [target] = first.targets;
  const [bonus] = first.bonus;
  await openGame(page);
  await drawWord(page, target!);
  await drawWord(page, bonus!);
  await page.getByRole('button', { name: 'Volver al inicio' }).click();

  await expect(page.getByRole('button', { name: /^Tu diccionario.*2 palabras/ })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: /^Tu diccionario/ }).click();
  const words = page.getByRole('main').getByRole('listitem');
  await expect(words).toHaveCount(2);

  await page.getByRole('searchbox', { name: 'Buscar' }).fill(target!.slice(0, 2).toLowerCase());
  await expect(words.filter({ hasText: written(target!) })).toBeVisible();
  await page.getByRole('searchbox', { name: 'Buscar' }).fill('zzz');
  await expect(words).toHaveCount(0);
  await expect(page.getByText('Ninguna palabra empieza con «zzz».')).toBeVisible();

  await page.getByRole('searchbox', { name: 'Buscar' }).fill('');
  await page.getByRole('button', { name: written(bonus!), exact: true }).click();
  await expect(page.getByRole('dialog', { name: written(bonus!) })).toBeVisible();
});
