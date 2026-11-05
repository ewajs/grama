import { readFile, mkdir } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { historyFile, type GramaSnapshot } from '../../src/app/assessment/export';
import { NEW_PROGRESS } from '../../src/core/progress';
import { PROFILE_KEYS, readProfile } from '../../src/storage/profile';
import { saveGame } from '../../src/storage/save';
import { DEFAULT_SETTINGS } from '../../src/storage/settings';
import { puzzleHistory, installHistory } from './progress-history';
import { assessmentRecords } from './records';
import { level } from './level';
import { drawWord } from './wheel';

test.use({
  storageState: { cookies: [], origins: [] },
  viewport: { width: 390, height: 844 },
  reducedMotion: 'reduce',
});

function sample() {
  const saved = new Map([['grama.words', '["SAL","SOL"]']]);
  saveGame(
    { ...NEW_PROGRESS, levelNumber: 12, score: 1234 },
    { setItem: (k, v) => saved.set(k, v) },
  );
  const snapshot: GramaSnapshot = {
    version: 2,
    records: [],
    checkpoints: [],
    exposures: [],
    sequence: 0,
  };
  return historyFile(snapshot, readProfile({ getItem: (k) => saved.get(k) ?? null }), {
    version: '0.23.0',
    build: 'test',
    at: 0,
  });
}
async function choose(page: Page, content: string) {
  await page.getByText('Traer tus datos', { exact: true }).click();
  await shot(page, 'picker');
  await page.locator('input[type=file]').setInputFiles({
    name: 'grama.json',
    mimeType: 'application/json',
    buffer: Buffer.from(content),
  });
}
async function profile(page: Page) {
  return page.evaluate(
    (keys) => Object.fromEntries(keys.map((key) => [key, localStorage.getItem(key)])),
    PROFILE_KEYS,
  );
}
async function shot(page: Page, name: string) {
  if (test.info().project.name !== 'mobile') return;
  await mkdir('/tmp/grama-import', { recursive: true });
  for (const dialog of await page.locator('dialog[open]').all())
    await expect(dialog).toHaveCSS('opacity', '1');
  await page.screenshot({
    path: `/tmp/grama-import/${name}.png`,
    animations: 'disabled',
    scale: 'css',
  });
}

test('a downloaded profile restores in a separate browser context and resumes the original recording', async ({
  page,
  browser,
}) => {
  await page.addInitScript(
    (settings) => localStorage.setItem('grama.settings', JSON.stringify(settings)),
    { ...DEFAULT_SETTINGS, tutorialSeen: true },
  );
  await page.goto('./');
  await page.getByRole('button', { name: /^Tu progreso/ }).click();
  await expect(page.getByText(/Completá un nivel o una partida/)).toBeVisible();
  await installHistory(page, puzzleHistory());
  await page.goBack();
  await page.getByRole('button', { name: /^Jugar/ }).click();
  await drawWord(page, level(1).targets[0]!);
  await page.getByRole('button', { name: 'Volver al inicio', exact: true }).click();
  await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('grama.settings')!);
    localStorage.setItem('grama.settings', JSON.stringify({ ...saved, theme: 'yerba' }));
    localStorage.setItem(
      'grama.trials',
      '{"runs":3,"best":{"points":50,"cleared":0,"words":1},"mostCleared":0}',
    );
  });
  await page.getByRole('button', { name: /^Tu progreso/ }).click();
  await page.getByText('Compartir comentarios', { exact: true }).click();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Descargar datos', exact: true }).click(),
  ]);
  const content = await readFile((await download.path())!, 'utf8'),
    file = JSON.parse(content);
  expect(file.assessment.checkpoints).toHaveLength(1);
  const original = file.assessment.checkpoints[0];
  const target = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
  });
  try {
    const fresh = await target.newPage();
    await fresh.goto(new URL('./', page.url()).href);
    await fresh.getByRole('button', { name: /^Tu progreso/ }).click();
    await choose(fresh, content);
    const dialog = fresh.getByRole('dialog', { name: 'Importar tus datos' });
    await expect(dialog).toContainText('8 partidas registradas');
    await shot(fresh, 'preview');
    await Promise.all([
      fresh.waitForEvent('load'),
      dialog.getByRole('button', { name: 'Reemplazar e importar' }).click(),
    ]);
    await expect(fresh.getByRole('button', { name: /^Jugar.*Nivel 1/ })).toBeVisible();
    await expect(fresh.locator('html')).toHaveAttribute('data-theme', 'yerba');
    expect(await profile(fresh)).toEqual(file.profile);
    const restored = await assessmentRecords(fresh);
    expect(restored.attempts).toEqual(file.records);
    expect(restored.checkpoints).toEqual(file.assessment.checkpoints);
    await fresh.getByRole('button', { name: /^Jugar/ }).click();
    await expect
      .poll(async () => (await assessmentRecords(fresh)).checkpoints[0]?.attempt.id)
      .toBe(original.attempt.id);
    for (const word of level(1).targets.slice(1)) await drawWord(fresh, word);
    const win = fresh.getByRole('dialog', { name: '¡Bien ahí!' });
    await expect(win.getByRole('status')).toHaveCount(0);
    await win.getByRole('button', { name: 'Siguiente nivel' }).click();
    await expect
      .poll(async () => (await assessmentRecords(fresh)).checkpoints[0]?.attempt.sequence)
      .toBe(file.assessment.sequence + 1);
    expect((await assessmentRecords(fresh)).checkpoints[0]?.attempt.exposures[0]?.kind).toBe(
      'repeat',
    );
  } finally {
    await target.close();
  }
});

test('preview cancellation and incompatible files do not change saved data', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: /^Tu progreso/ }).click();
  const before = await profile(page);
  await choose(page, sample().content);
  const dialog = page.getByRole('dialog', { name: 'Importar tus datos' });
  await expect(dialog).toContainText('Nivel 12 · 1234 puntos · 2 palabras');
  await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(dialog).toBeHidden();
  expect(await profile(page)).toEqual(before);
  const old = JSON.parse(sample().content);
  old.version = 1;
  await page.locator('input[type=file]').setInputFiles({
    name: 'old.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(old)),
  });
  await expect(page.getByRole('alert')).toContainText('archivos antiguos de solo historial');
  await shot(page, 'incompatible');
  expect(await profile(page)).toEqual(before);
});

test('a failed profile write rolls back the old game and recording database', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('grama.words', '["OLD"]');
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'grama.words' && value === '["SAL","SOL"]')
        throw new DOMException('Injected full storage', 'QuotaExceededError');
      return original.call(this, key, value);
    };
  });
  await page.goto('./');
  await page.getByRole('button', { name: /^Tu progreso/ }).click();
  await expect(page.getByText(/Completá un nivel o una partida/)).toBeVisible();
  await installHistory(page, puzzleHistory());
  const before = await profile(page),
    records = await assessmentRecords(page);
  await choose(page, sample().content);
  await page.getByRole('button', { name: 'Reemplazar e importar', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('No pudimos importar');
  expect(await profile(page)).toEqual(before);
  expect(await assessmentRecords(page)).toEqual(records);
});
