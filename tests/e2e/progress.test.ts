import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { NEW_PROGRESS } from '../../src/core/progress';
import { saveGame } from '../../src/storage/save';
import { level } from './level';
import { drawWord } from './wheel';

import { performanceHistory } from '../../src/app/assessment/performance';
import { puzzleHistory, trialHistory, installHistory } from './progress-history';

test.use({ storageState: { cookies: [], origins: [] } });

test('progress opens from Home, handles an empty profile and browser back', async ({ page }) => {
  await page.goto('./');
  await page.setViewportSize({ width: 375, height: 667 });
  await page.getByRole('button', { name: /^Tu progreso/ }).click();
  await expect(page.getByRole('heading', { name: 'Tu progreso', exact: true })).toBeVisible();
  await expect(
    page.getByText('Completá un nivel o una partida de Contrarreloj para ver tus resultados acá.'),
  ).toBeVisible();
  await expect(page.getByRole('region', { name: 'Contrarreloj', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Actualizar', exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /GitHub/ })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.goBack();
  await expect(page.getByRole('button', { name: /^Jugar/ })).toBeVisible();
});

test('progress includes new play for an existing player', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem('grama.settings', JSON.stringify({ tutorialSeen: true })),
  );
  await page.goto('./');
  await page.getByRole('button', { name: /^Jugar/ }).click();
  await page.getByRole('button', { name: 'Pista: te quedan 3' }).click();
  for (const word of level(1).targets) await drawWord(page, word);
  await page.getByRole('button', { name: 'Siguiente nivel' }).click();
  await page.getByRole('button', { name: 'Volver al inicio', exact: true }).click();
  await page.getByRole('button', { name: /^Tu progreso/ }).click();
  const recent = page.getByRole('region', { name: 'Partidas recientes' });
  await expect(recent).toContainText('Nivel 1');
  await expect(recent).toContainText('1 pista');
  await expect(recent).toContainText('Nivel de juego:');
  await expect(page.getByText('Tu nivel se va ajustando a medida que jugás.')).toBeVisible();
  await expect(page.getByRole('img')).toHaveCount(1);
  await expect(page.getByRole('checkbox')).toHaveCount(0);
});

test('progress loads ratings, accessible history and practice without quotas, and refreshes on entry', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: /^Tu progreso/ }).click();
  await expect(
    page.getByText('Completá un nivel o una partida de Contrarreloj para ver tus resultados acá.'),
  ).toBeVisible();
  const records = puzzleHistory(),
    expected = performanceHistory(records),
    rounded = Math.round(expected.current!.rating).toLocaleString('es-AR');
  await installHistory(page, records);
  await page.goBack();
  await page.getByRole('button', { name: /^Tu progreso/ }).click();
  await expect(page.getByLabel(`Nivel de juego: ${rounded}`, { exact: true })).toBeVisible();
  await expect(page.getByRole('img')).toHaveAccessibleName(/Nivel 1:.*Nivel 6:/);
  const recent = page.getByRole('region', { name: 'Partidas recientes' });
  await expect(recent.locator('li')).toHaveCount(8);
  await expect(recent).toContainText('Práctica');
  await expect(recent).toContainText('Sin puntaje');
  await expect(page.getByText(/de 20|Comparable|Tiempo incompleto|Historial previo/)).toHaveCount(
    0,
  );
  await page.getByText('Cómo se calcula', { exact: true }).click();
  await expect(page.getByText(/Resolver niveles difíciles pesa más/)).toBeVisible();
  for (const size of [
    { width: 375, height: 667 },
    { width: 844, height: 390 },
    { width: 1280, height: 800 },
  ]) {
    await page.setViewportSize(size);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await page.reload();
  await page.getByRole('button', { name: /^Tu progreso/ }).click();
  await expect(page.getByLabel(`Nivel de juego: ${rounded}`, { exact: true })).toBeVisible();
});

test('progress pages trial history and keeps its best separate from puzzle ratings', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: /^Tu progreso/ }).click();
  await expect(
    page.getByText('Completá un nivel o una partida de Contrarreloj para ver tus resultados acá.'),
  ).toBeVisible();
  await installHistory(page, trialHistory());
  await page.goBack();
  await page.getByRole('button', { name: /^Tu progreso/ }).click();
  const trial = page.getByRole('region', { name: 'Contrarreloj', exact: true });
  await expect(trial).toContainText('Mejor puntaje registrado');
  await expect(trial).toContainText(`${performanceHistory(trialHistory()).trialBest}`);
  await expect(trial.locator('li')).toHaveCount(5);
  await expect(page.getByRole('region', { name: 'Resolución de palabras' })).toHaveCount(0);
});

test('progress storage failure keeps navigation and ordinary play available', async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, 'indexedDB', {
      get() {
        throw new DOMException('Blocked', 'SecurityError');
      },
    }),
  );
  await page.goto('./');
  await page.getByRole('button', { name: /^Tu progreso/ }).click();
  await expect(page.getByRole('alert')).toContainText('No pudimos cargar tu progreso');
  await page.getByRole('button', { name: 'Volver a intentar', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  let downloads = 0;
  page.on('download', () => downloads++);
  await page.getByText('Compartir comentarios', { exact: true }).click();
  await page.getByRole('button', { name: 'Descargar historial', exact: true }).click();
  await expect(
    page.getByText('No pudimos preparar el archivo. Volvé a intentar; podés seguir jugando.'),
  ).toBeVisible();
  expect(downloads).toBe(0);
  await page.getByRole('button', { name: 'Volver al inicio', exact: true }).click();
  await page.getByRole('button', { name: /^Jugar/ }).click();
  await page.getByRole('button', { name: 'Saltear', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await drawWord(page, level(1).targets[0]!);
  await expect(page.getByLabel('Puntos')).not.toHaveText('0');
});

test('existing game progress is preserved without manufacturing past assessment history', async ({
  page,
}) => {
  let saved = '';
  saveGame(
    { ...NEW_PROGRESS, levelNumber: 24, score: 900 },
    {
      setItem: (_key, value) => {
        saved = value;
      },
    },
  );
  await page.addInitScript((value) => localStorage.setItem('grama.save', value), saved);
  await page.goto('./');
  await expect(page.getByRole('button', { name: /^Jugar.*Nivel 24/ })).toBeVisible();
  await page.getByRole('button', { name: /^Tu progreso/ }).click();
  await expect(
    page.getByText('Completá un nivel o una partida de Contrarreloj para ver tus resultados acá.'),
  ).toBeVisible();
  await expect(page.getByRole('checkbox')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('grama.save'))).toBe(saved);
  await page.getByRole('button', { name: 'Volver al inicio', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Jugar.*Nivel 24/ })).toBeVisible();
});

test('history download rereads every page and preserves original evidence for recalculation', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: /^Tu progreso/ }).click();
  await expect(
    page.getByText('Completá un nivel o una partida de Contrarreloj para ver tus resultados acá.'),
  ).toBeVisible();
  const records = [...puzzleHistory(), ...trialHistory()];
  const first = records[0]!;
  if ('place' in first.payload) first.payload.session = { ...first.payload.session, found: [] };
  first.attempt = { ...first.attempt, status: 'abandoned' };
  Reflect.deleteProperty(first.attempt, 'result');
  records[1]!.attempt.exposures[0]!.kind = 'unknown';
  await installHistory(page, records);
  // The screen still holds its empty snapshot; download must read the actual store again.
  await page.getByText('Compartir comentarios', { exact: true }).click();
  const button = page.getByRole('button', { name: 'Descargar historial', exact: true });
  await expect(button).toHaveAccessibleDescription(
    /partidas completas y abandonadas.*no se envía automáticamente/i,
  );
  const [download] = await Promise.all([page.waitForEvent('download'), button.click()]);
  expect(download.suggestedFilename()).toMatch(/^grama-historial-\d{4}-\d{2}-\d{2}\.json$/);
  expect(download.url()).toMatch(/^blob:/);
  const file = JSON.parse(await readFile((await download.path())!, 'utf8'));
  expect(file).toMatchObject({
    format: 'grama-assessment-history',
    version: 1,
    model: { version: 2, prior: { rating: 1500 }, tau: 0.5 },
  });
  expect(file.app.version).toMatch(/^\d+\.\d+\.\d+$/);
  expect(file.app.build).toBeTruthy();
  expect(Number.isFinite(Date.parse(file.exportedAt))).toBe(true);
  expect(file.records).toEqual(records);
  expect(performanceHistory(file.records)).toEqual(performanceHistory(records));
  await expect(page.getByRole('status')).toHaveText(
    'Descarga iniciada. Compartí el archivo solo si querés.',
  );
  await page.goBack();
  await expect(page.getByRole('button', { name: /^Jugar/ })).toBeVisible();
});
