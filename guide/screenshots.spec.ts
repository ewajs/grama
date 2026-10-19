/**
 * The guide's screenshots, taken from the real game with made-up progress. Run with
 * `npm run guide:screenshots` after changing what they show; the images are committed.
 */
import { test, type Page } from '@playwright/test';
import { occurrence, occurrencesBefore } from '../src/core/cadence.ts';
import { level } from '../tests/e2e/level.ts';
import { drawWord } from '../tests/e2e/wheel.ts';

const OUT = 'guide/public/screenshots';

/** `YYYY-MM-DD`, `offset` days from today. */
function day(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** A player 24 levels in, with stars, a few dailies and a 4-day streak. */
function veteran() {
  const cycle = ['easy', 'medium', 'medium', 'hard', 'easy', 'medium', 'extra'];
  const history: Record<number, unknown> = {};
  for (let number = 1; number < 25; number++) {
    const tier = number < 15 && number % 7 === 0 ? 'hard' : cycle[(number - 1) % 7];
    const stars = [3, 2, 3, 1, 3, 2][number % 6];
    history[number] = {
      tier,
      difficulty: 'normal',
      occurrence: occurrence(number, 'normal'),
      stars,
      hints: stars === 3 ? 0 : 1,
      bonus: 3,
      targets: 7,
    };
  }
  const daily = {
    tier: 'easy',
    difficulty: 'normal',
    occurrence: 0,
    stars: 3,
    hints: 0,
    bonus: 4,
    targets: 8,
  };
  return {
    version: 8,
    progress: {
      levelNumber: 25,
      score: 12840,
      hints: 4,
      bonusTowardHint: 3,
      difficulty: 'normal',
      occurrences: occurrencesBefore(25, 'normal'),
      session: { found: [], revealed: {} },
      history,
      daily: { date: '', session: { found: [], revealed: {} } },
      dailies: { [day(-1)]: daily, [day(-2)]: daily, [day(-3)]: daily, [day(-4)]: daily },
    },
  };
}

/** Opens the game with a save (or a fresh one) and the tutorial already seen. */
async function open(page: Page, path = './', save?: object) {
  await page.addInitScript(
    (saved) => {
      localStorage.setItem('grama.settings', '{"tutorialSeen":true}');
      if (saved) localStorage.setItem('grama.save', saved);
    },
    save && JSON.stringify(save),
  );
  await page.goto(path);
}

const shot = (page: Page, name: string) => page.screenshot({ path: `${OUT}/${name}.png` });

test('home, map, achievements and the menu', async ({ page }) => {
  await open(page, './', veteran());
  await page.getByRole('button', { name: /^Jugar/ }).waitFor();
  await page.waitForTimeout(400);
  await shot(page, 'inicio');
  await page.getByRole('button', { name: /^Mapa/ }).click();
  await page.waitForTimeout(500);
  await shot(page, 'mapa');
  await page.goBack();
  await page.getByRole('button', { name: /^Logros/ }).click();
  await page.waitForTimeout(500);
  await shot(page, 'logros');
  await page.goBack();
  await page.getByRole('button', { name: /^Desafío del día/ }).click();
  await page.locator('[data-letter]').first().waitFor();
  await page.waitForTimeout(400);
  await shot(page, 'desafio');
  await page.getByRole('button', { name: 'Abrir el menú' }).click();
  await page.waitForTimeout(500);
  await shot(page, 'menu');
});

test('an extra-hard level', async ({ page }) => {
  await open(page, './?nivel=21', veteran());
  await page.locator('[data-letter]').first().waitFor();
  await page.waitForTimeout(400);
  await shot(page, 'extra-dificil');
});

test('playing a level, from first words to the end', async ({ page }) => {
  const first = level(1);
  await open(page);
  await page.getByRole('button', { name: /^Jugar/ }).click();
  const [one, two, ...rest] = first.targets;
  for (const word of [one!, two!, first.bonus[0]!]) await drawWord(page, word);
  await page.getByRole('button', { name: /^Pista/ }).click();
  await page.waitForTimeout(800);

  // Mid-drag on the next target, so the line and the word pill show.
  const next = rest.at(-1)!;
  const letters = await page.locator('[data-letter]').evaluateAll((elements) =>
    elements.map((element) => {
      const box = element.getBoundingClientRect();
      return {
        letter: element.getAttribute('data-letter'),
        x: box.x + box.width / 2,
        y: box.y + box.height / 2,
      };
    }),
  );
  const route = [...next.slice(0, 4)].map(
    (letter) =>
      letters.splice(
        letters.findIndex((l) => l.letter === letter),
        1,
      )[0]!,
  );
  await page.mouse.move(route[0]!.x, route[0]!.y);
  await page.mouse.down();
  for (const point of route.slice(1)) await page.mouse.move(point.x, point.y, { steps: 4 });
  await shot(page, 'jugando');
  await page.mouse.up();

  await page.waitForTimeout(800);
  await page.getByRole('button', { name: /^Palabras extra/ }).click();
  await page.waitForTimeout(500);
  await shot(page, 'palabras-extra');
  await page.keyboard.press('Escape');

  for (const word of first.bonus.slice(1, 3)) await drawWord(page, word);
  for (const word of rest) await drawWord(page, word);
  await page.waitForTimeout(1500);
  await shot(page, 'nivel-completo');
});
