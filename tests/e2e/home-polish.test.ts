import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { describePuzzle } from '../../src/app/assessment/grama';
import { performanceHistory } from '../../src/app/assessment/performance';
import { installHistory, puzzleHistory } from './progress-history';
import { assessmentRecords } from './records';
import { level, todaysDaily } from './level';
import { drawWord } from './wheel';

// Review images come from real browser flows on a controlled local test profile.
test.use({ reducedMotion: 'reduce', viewport: { width: 390, height: 844 } });
async function shot(page: Page, name: string) {
  if (test.info().project.name !== 'mobile') return;
  await mkdir('/tmp/grama-polish', { recursive: true });
  for (const dialog of await page.locator('dialog[open]').all())
    await expect(dialog).toHaveCSS('opacity', '1');
  await page.screenshot({
    path: `/tmp/grama-polish/${name}.png`,
    animations: 'disabled',
    scale: 'css',
  });
}
async function seed(page: Page, strong = false) {
  await page.goto('./');
  await page.getByRole('button', { name: /^Tu progreso/ }).click();
  await expect(
    page.getByText('Completá un nivel o una partida de Contrarreloj para ver tus resultados acá.'),
  ).toBeVisible();
  const records = puzzleHistory().slice(0, 6);
  if (strong)
    for (const [index, record] of records.entries()) {
      if (!('place' in record.payload)) continue;
      const played = level(41 + index),
        descriptor = describePuzzle(played, new Map(played.targets.map((word) => [word, 10000])));
      record.payload = {
        ...record.payload,
        place: { kind: 'level', levelNumber: 41 + index, difficulty: 'normal', occurrence: index },
        level: played,
        descriptor,
        session: { ...record.payload.session, found: played.targets },
      };
      record.attempt.exposures = [{ ...record.attempt.exposures[0]!, key: descriptor.exposureKey }];
      if (record.attempt.status === 'completed')
        record.attempt.result = { kind: 'puzzle', found: played.targets, revealed: {} };
    }
  await installHistory(page, records);
  await page.goBack();
  await expect(
    page.getByLabel(
      `Nivel de juego: ${Math.round(performanceHistory(records).current!.rating).toLocaleString('es-AR')}`,
    ),
  ).toBeVisible();
}
async function finish(page: Page, number: number) {
  for (const word of level(number).targets) await drawWord(page, word);
  const modal = page.getByRole('dialog', { name: '¡Bien ahí!' });
  // The accessible points label has the final value even while its visible counter animates.
  const points = modal.locator('.points');
  await expect(points).toHaveText((await points.getAttribute('aria-label'))!);
  return modal;
}

test('Home exposes guide and shared settings even before word lists load', async ({ page }) => {
  await page.route('**/*.txt', (route) => route.abort());
  await page.goto('./');
  await expect(page.getByRole('link', { name: 'Guía del juego', exact: true })).toHaveAttribute(
    'href',
    '/grama/guia/',
  );
  const menu = page.getByRole('button', { name: 'Abrir el menú' });
  await menu.click();
  const dialog = page.getByRole('dialog', { name: 'Menú', exact: true });
  await dialog.getByRole('radio', { name: 'Oscuro' }).click();
  await dialog.getByRole('switch', { name: 'Sonido' }).click();
  const report = new URL(
    (await dialog.getByRole('link', { name: 'Reportar un problema' }).getAttribute('href'))!,
  );
  expect(report.searchParams.get('body')).toContain('Desde el inicio');
  expect(report.searchParams.get('body')).not.toContain('Letras:');
  await shot(page, 'home-menu-dark');
  await dialog.getByRole('button', { name: 'Volver al inicio' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator('html')).toHaveAttribute('data-mode', 'dark');
  const records = await page.evaluate(() => localStorage.getItem('grama.save'));
  expect(records).toBeNull();
  if (test.info().project.name === 'desktop') await expect(menu).toBeFocused();
});

test('Home shows the rating with guide/menu without adding rows of stats', async ({ page }) => {
  await seed(page);
  await shot(page, 'home-light');
  await page.emulateMedia({ colorScheme: 'dark' });
  await shot(page, 'home-dark');
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(
    true,
  );
  await page.setViewportSize({ width: 375, height: 667 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.setViewportSize({ width: 1280, height: 800 });
  await shot(page, 'home-desktop');
});

test('first completion shows a rating and Home advances once without exposing another board', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: /^Jugar/ }).click();
  const modal = await finish(page, 1);
  await expect(modal.getByRole('status')).toContainText('Tu primer nivel de juego');
  await shot(page, 'win-first-light');
  await modal.getByRole('button', { name: 'Volver al inicio' }).click();
  await expect(page.getByRole('button', { name: /^Jugar.*Nivel 2/ })).toBeVisible();
  const records = await assessmentRecords(page);
  expect(records.attempts).toHaveLength(1);
  expect(records.checkpoints).toHaveLength(0);
  await page.getByRole('button', { name: /^Jugar/ }).click();
  await expect(page.getByText('Nivel 2', { exact: true })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('completion presents an increase for its saved attempt', async ({ page }) => {
  await seed(page);
  await page.goto('./?nivel=21');
  const modal = await finish(page, 21);
  await expect(modal.getByLabel(/^Subiste .* puntos de nivel de juego$/)).toBeVisible();
  await shot(page, 'win-increase-light');
  await page.emulateMedia({ colorScheme: 'dark' });
  await shot(page, 'win-increase-dark');
  await page.setViewportSize({ width: 844, height: 390 });
  await shot(page, 'win-landscape');
  await modal.getByRole('button', { name: 'Siguiente nivel' }).click();
  await expect(page.getByText('Nivel 22', { exact: true })).toBeVisible();
});

test('completion presents a decrease calmly, while replays have no rating line', async ({
  page,
}) => {
  await seed(page, true);
  await page.getByRole('button', { name: /^Jugar/ }).click();
  const modal = await finish(page, 1);
  await expect(modal.getByLabel(/^Bajaste .* puntos de nivel de juego$/)).toBeVisible();
  await shot(page, 'win-decrease-light');
  await page.emulateMedia({ colorScheme: 'dark' });
  await shot(page, 'win-decrease-dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await modal.getByRole('button', { name: 'Volver al inicio' }).click();
  await page.getByRole('button', { name: /^Mapa/ }).click();
  await page.getByRole('button', { name: 'Jugar el nivel 1' }).click();
  for (const word of level(1).targets) await drawWord(page, word);
  await expect(modal.getByText('Ya lo habías completado: no suma puntos')).toBeVisible();
  await expect(modal.getByRole('status')).toHaveCount(0);
  await shot(page, 'win-replay-light');
  await modal.getByRole('button', { name: 'Volver al inicio' }).click();
  await expect(page.getByRole('button', { name: /^Jugar.*Nivel 2/ })).toBeVisible();
});

test('daily completion retains Share and a single Home action', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: /^Desafío del día/ }).click();
  for (const word of todaysDaily().level.targets) await drawWord(page, word);
  const modal = page.getByRole('dialog');
  await expect(modal.getByRole('status')).toContainText('Tu primer nivel de juego');
  await expect(modal.getByRole('button', { name: 'Compartir', exact: true })).toBeVisible();
  await expect(modal.getByRole('button', { name: 'Volver al inicio' })).toHaveCount(1);
  await shot(page, 'win-daily-light');
  await modal.getByRole('button', { name: 'Volver al inicio' }).click();
  await expect(page.getByRole('button', { name: /^Jugar.*Nivel 1/ })).toBeVisible();
});
