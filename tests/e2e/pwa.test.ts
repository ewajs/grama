import { expect, test } from '@playwright/test';

test('can be installed: manifest with icons', async ({ page, request }) => {
  await page.goto('./');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  const manifest = await (await request.get(new URL(href!, page.url()).href)).json();
  expect(manifest).toMatchObject({ name: 'Grama', display: 'standalone', start_url: '/grama/' });
  for (const icon of manifest.icons) {
    expect((await request.get(new URL(icon.src, page.url()).href)).ok()).toBe(true);
  }
});

test('works offline once loaded', async ({ page, context }) => {
  await page.goto('./');
  await page.locator('[data-letter]').first().waitFor();
  // The first service worker activates as soon as it has cached everything.
  await page.evaluate(() => navigator.serviceWorker.ready);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('Nivel 1')).toBeVisible();
  await expect(page.locator('[data-letter]').first()).toBeVisible();
});
