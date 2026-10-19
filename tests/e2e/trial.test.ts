import { expect, test } from '@playwright/test';
import { trialWheel } from './level.ts';
import { drawWord } from './wheel.ts';

// Runs pick their wheels at random: a fixed Math.random makes them known.
const RANDOM = 0.5;

test.beforeEach(async ({ page }) => {
  await page.addInitScript((value) => (Math.random = () => value), RANDOM);
  await page.clock.install();
});

test('Contrarreloj: words win time, Pasar skips, and the run ends with a summary', async ({
  page,
}) => {
  const wheel = trialWheel(RANDOM);
  await page.goto('./');
  await page.getByRole('button', { name: /^Contrarreloj/ }).click();
  await expect(page.getByRole('timer')).toHaveText('1:00');

  await page.clock.fastForward(5_000);
  await expect(page.getByRole('timer')).toContainText('0:55');
  await drawWord(page, wheel.targets[0]!);
  await expect(page.getByLabel('Puntos')).toHaveText(String(wheel.targets[0]!.length * 10));
  await expect(page.getByRole('timer')).toContainText('0:58');

  await page.getByRole('button', { name: /^Pasar/ }).click();
  await expect(page.getByText('Rueda 2')).toBeVisible();
  await expect(page.getByRole('timer')).toContainText('0:48');

  await page.clock.fastForward(60_000);
  const summary = page.getByRole('dialog');
  await expect(summary).toContainText('¡Tiempo!');
  await expect(summary).toContainText('¡Tu mejor marca!');
  await summary.getByRole('button', { name: 'Volver al inicio' }).click();
  await expect(page.getByRole('button', { name: /^Contrarreloj.*Mejor: \d+/ })).toBeVisible();
});
