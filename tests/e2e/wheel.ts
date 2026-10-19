import type { Page } from '@playwright/test';

/**
 * Drags across the wheel's letters to spell `word`, then releases; with `cancel`, the
 * system takes the pointer instead (as an edge swipe or a call would) before release.
 */
export async function drawWord(page: Page, word: string, { cancel = false } = {}): Promise<void> {
  const letters = page.locator('[data-letter]');
  await letters.first().waitFor(); // the wheel appears once the words have loaded
  const available = await letters.evaluateAll((elements) =>
    elements.map((element) => {
      const box = element.getBoundingClientRect();
      return {
        letter: element.getAttribute('data-letter'),
        x: box.x + box.width / 2,
        y: box.y + box.height / 2,
      };
    }),
  );
  const route = [...word].map((letter) => {
    const index = available.findIndex((candidate) => candidate.letter === letter);
    if (index === -1) throw new Error(`No ${letter} left on the wheel to spell ${word}`);
    return available.splice(index, 1)[0]!;
  });

  const [first, ...rest] = route;
  if (await touchDrags(page)) {
    // Real touch input, so the wheel gets touch pointers (and the browser's scroll handling).
    const cdp = await page.context().newCDPSession(page);
    const touch = (type: string, point?: { x: number; y: number }) =>
      cdp.send('Input.dispatchTouchEvent', { type, touchPoints: point ? [point] : [] });
    await touch('touchStart', first);
    for (const point of rest) await touch('touchMove', point);
    await touch(cancel ? 'touchCancel' : 'touchEnd');
    await cdp.detach();
    return;
  }
  await page.mouse.move(first!.x, first!.y);
  await page.mouse.down();
  for (const point of rest) await page.mouse.move(point.x, point.y, { steps: 5 });
  // The mouse is pointer 1.
  if (cancel) await page.getByRole('application').dispatchEvent('pointercancel', { pointerId: 1 });
  await page.mouse.up();
}

/** Whether drags can be real touches: a touch screen, in Chromium (which takes them). */
async function touchDrags(page: Page): Promise<boolean> {
  const chromium = page.context().browser()?.browserType().name() === 'chromium';
  return chromium && (await page.evaluate(() => navigator.maxTouchPoints > 0));
}
