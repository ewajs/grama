import type { Page } from '@playwright/test';

/** Drags across the wheel's letters to spell `word`, then releases. */
export async function drawWord(page: Page, word: string): Promise<void> {
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
  await page.mouse.move(first!.x, first!.y);
  await page.mouse.down();
  for (const point of rest) await page.mouse.move(point.x, point.y, { steps: 5 });
  await page.mouse.up();
}
