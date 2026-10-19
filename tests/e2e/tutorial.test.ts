import { expect, test } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test('a first launch shows the tutorial, once', async ({ page }) => {
  await page.goto('./');
  const tutorial = page.getByRole('dialog', { name: 'Uní las letras' });
  await expect(tutorial).toBeVisible();
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await expect(page.getByRole('dialog', { name: 'Completá el tablero' })).toBeVisible();
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.getByRole('button', { name: '¡A jugar!' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await page.reload();
  await page.locator('[data-letter]').first().waitFor();
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('the menu shows the tutorial again', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Saltear' }).click();
  await page.getByRole('button', { name: 'Abrir el menú' }).click();
  await page.getByRole('button', { name: 'Cómo jugar' }).click();
  await expect(page.getByRole('dialog', { name: 'Uní las letras' })).toBeVisible();
});
