import { expect, test } from '@playwright/test';

test('the app loads on the first level', async ({ page }) => {
  await page.goto('./');
  await expect(page).toHaveTitle('Grama');
  await expect(page.getByText('Nivel 1')).toBeVisible();
});
