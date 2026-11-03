import { expect, test } from '@playwright/test';

const parseRating = (text: string | null) => Number(text?.replaceAll('.', '').replace(',', '.'));

test('equations render and the keyboard calculator teaches factor and uncertainty effects', async ({
  page,
}) => {
  await page.goto('calculo-del-nivel');
  await expect(
    page.getByRole('heading', { name: /^El cálculo, paso a paso/, level: 1 }),
  ).toBeVisible();
  expect(await page.locator('mjx-container svg').count()).toBeGreaterThan(10);
  expect(await page.locator('mjx-assistive-mml').count()).toBeGreaterThan(10);
  await expect(page.locator('mjx-container merror')).toHaveCount(0);
  const lab = page.getByRole('region', { name: 'Probá el cálculo', exact: true });
  const result = lab.getByLabel('Resultado del tablero', { exact: true });
  const updated = lab.getByLabel('Nivel después del tablero', { exact: true });
  await expect(updated).toHaveText('1.508,23');
  await lab.getByRole('slider', { name: 'Dificultad del tablero', exact: true }).focus();
  await page.keyboard.press('End');
  await expect(lab.getByLabel('Nivel del tablero', { exact: true })).toHaveText('2.100');
  expect(parseRating(await updated.textContent())).toBeGreaterThan(1508.23);
  await lab.getByRole('slider', { name: 'Dificultad del tablero', exact: true }).press('Home');
  await lab.getByRole('checkbox').uncheck();
  await expect(result).toHaveText('0,65');
  await lab.getByRole('slider', { name: 'Pistas usadas', exact: true }).press('End');
  await expect(result).toHaveText('0,50');
  await lab.getByRole('slider', { name: 'Palabras extra', exact: true }).press('End');
  await expect(result).toHaveText('0,54');
  await expect(lab.getByRole('img')).toHaveAccessibleName(/resultado obtenido 0,54/i);
  const before = parseRating(await updated.textContent());
  await lab.getByText('Cambiá tu punto de partida', { exact: true }).click();
  await lab.getByRole('slider', { name: 'Incertidumbre anterior', exact: true }).press('Home');
  const after = parseRating(await updated.textContent());
  expect(Math.abs(after - 1500)).toBeLessThan(Math.abs(before - 1500));
  for (const width of [375, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await lab.screenshot({ path: '/tmp/grama-rating-learning.png' });
  await page.goto('tu-nivel');
  await expect(page.getByRole('heading', { name: /^Tu nivel de juego/, level: 1 })).toBeVisible();
});
