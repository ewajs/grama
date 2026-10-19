import { expect, test } from '@playwright/test';
import { enterGame, openGame } from './app.ts';
import { level } from './level.ts';
import { drawWord } from './wheel.ts';

const openMenu = (page: import('@playwright/test').Page) =>
  page.getByRole('button', { name: 'Abrir el menú' }).click();

test('the chosen theme applies and survives a reload', async ({ page }) => {
  await openGame(page);
  await openMenu(page);
  await page.getByRole('radio', { name: 'Oscuro' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await enterGame(page);
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
  await page.getByRole('button', { name: 'Acerca de' }).click();
  await page.getByRole('button', { name: 'Empezar de cero' }).click();
  await page.getByRole('button', { name: 'Sí, empezar de cero' }).click();
  await expect(page.getByText('Nivel 1', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Puntos')).toHaveText('0');
});

test('offers to install the app when the browser can', async ({ page }) => {
  await openGame(page);
  await page.locator('[data-letter]').first().waitFor();
  // Simulates Chrome offering its install prompt.
  await page.evaluate(() => {
    const event = Object.assign(new Event('beforeinstallprompt'), {
      prompt: async () => void ((window as unknown as { prompted: boolean }).prompted = true),
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    });
    window.dispatchEvent(event);
  });
  await openMenu(page);
  await page.getByRole('button', { name: 'Instalar Grama' }).click();
  expect(await page.evaluate(() => (window as unknown as { prompted: boolean }).prompted)).toBe(
    true,
  );
});

test('the vibration switch survives a reload', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'Safari has no vibration, so no switch');
  await openGame(page);
  await openMenu(page);
  const vibration = page.getByRole('switch', { name: 'Vibración' });
  await expect(vibration).toBeChecked();
  await vibration.uncheck();
  await page.reload();
  await enterGame(page);
  await openMenu(page);
  await expect(page.getByRole('switch', { name: 'Vibración' })).not.toBeChecked();
});

test('the difficulty setting survives a reload', async ({ page }) => {
  await openGame(page);
  await openMenu(page);
  await page.getByRole('radio', { name: 'Desafiante' }).click();
  await page.reload();
  await enterGame(page);
  await openMenu(page);
  await expect(page.getByRole('radio', { name: 'Desafiante' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
});

test('the header always shows the level’s difficulty', async ({ page }) => {
  // The level's own tier: usually the cadence's, but the generator may settle for another.
  const labels = { easy: 'Fácil', medium: 'Media', hard: 'Difícil', extra: 'Extra difícil' };
  await openGame(page);
  await expect(
    page.locator('header').getByText(labels[level(1).tier], { exact: true }),
  ).toBeVisible();
  // Level 21 closes the third 7-level cycle: extra hard (see core/cadence.ts).
  await page.goto('./?nivel=21');
  await expect(page.locator('header').getByText('Extra difícil')).toBeVisible();
});

test('Acerca de shows the version and checks for updates', async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await enterGame(page);
  await openMenu(page);
  await expect(page.getByRole('link', { name: 'Todo sobre Grama' })).toHaveAttribute(
    'href',
    '/grama/guia/',
  );
  await page.getByRole('button', { name: 'Acerca de' }).click();
  const about = page.getByRole('dialog', { name: 'Acerca de' });
  await expect(about).toContainText(/Versión \d+\.\d+\.\d+/);
  await about.getByRole('button', { name: 'Buscar actualizaciones' }).click();
  await expect(about.getByRole('status')).toHaveText('Ya tenés la última versión.');
});
