/**
 * The guide's screenshots, taken from the real game with made-up progress. Run with
 * `npm run guide:screenshots` after changing what they show; the images are committed.
 */
import { test, type Page } from '@playwright/test';
import { occurrence, occurrencesBefore, tierFor } from '../src/core/cadence.ts';
import { dateKey } from '../src/core/daily.ts';
import type { LevelRecord } from '../src/core/history.ts';
import { NEW_PROGRESS, type Progress } from '../src/core/progress.ts';
import { saveGame } from '../src/storage/save.ts';
import { level, trialWheel } from '../tests/e2e/level.ts';
import { drawWord } from '../tests/e2e/wheel.ts';

const OUT = 'guide/public/screenshots';

/** `YYYY-MM-DD`, `offset` days from today. */
function day(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return dateKey(date);
}

/** A player 24 levels in, with stars, a few dailies and a 4-day streak, saved as the app would. */
function veteran(): string {
  const history: Record<number, LevelRecord> = {};
  for (let number = 1; number < 25; number++) {
    const stars = ([3, 2, 3, 1, 3, 2] as const)[number % 6] ?? 1;
    history[number] = {
      tier: tierFor(number, 'normal'),
      difficulty: 'normal',
      occurrence: occurrence(number, 'normal'),
      stars,
      hints: stars === 3 ? 0 : 1,
      bonus: 3,
      targets: 7,
    };
  }
  const daily: LevelRecord = { ...history[1]!, occurrence: 0, stars: 3, bonus: 4, targets: 8 };
  const progress: Progress = {
    ...NEW_PROGRESS,
    levelNumber: 25,
    score: 12840,
    hints: 4,
    hintsSpent: 9,
    bonusTowardHint: 3,
    occurrences: occurrencesBefore(25, 'normal'),
    history,
    dailies: { [day(-1)]: daily, [day(-2)]: daily, [day(-3)]: daily, [day(-4)]: daily },
  };
  let saved = '';
  saveGame(progress, { setItem: (_key, value) => (saved = value) });
  return saved;
}

/** The veteran's dictionary: the targets and a few bonus words of the levels played. */
function veteranWords(): string {
  const levels = Array.from({ length: 24 }, (_, index) => level(index + 1));
  return JSON.stringify([
    ...new Set(levels.flatMap((played) => [...played.targets, ...played.bonus.slice(0, 3)])),
  ]);
}

/** Opens the game with a save (or a fresh one), maybe a dictionary, and the tutorial seen. */
async function open(page: Page, path = './', save?: string, words?: string) {
  await page.addInitScript(
    ([saved, dictionary]) => {
      localStorage.setItem('grama.settings', '{"tutorialSeen":true}');
      if (saved) localStorage.setItem('grama.save', saved);
      if (dictionary) localStorage.setItem('grama.words', dictionary);
    },
    [save, words] as const,
  );
  await page.goto(path);
}

const shot = (page: Page, name: string) => page.screenshot({ path: `${OUT}/${name}.png` });

test('home, map, achievements, Tu diccionario and the menu', async ({ page }) => {
  await open(page, './', veteran(), veteranWords());
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
  await page.getByRole('button', { name: /^Tu diccionario/ }).click();
  await page.waitForTimeout(500);
  await shot(page, 'diccionario');
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

test.describe('on a computer', () => {
  // Also the install dialog's wide screenshot (manifest in vite.config.ts): 1280×800.
  test.use({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
  });

  test('board and wheel side by side', async ({ page }) => {
    const first = level(1);
    await open(page);
    await page.getByRole('button', { name: /^Jugar/ }).click();
    await page.locator('[data-letter]').first().waitFor();
    for (const word of first.targets.slice(0, 3)) {
      await page.keyboard.type(word.toLowerCase());
      await page.keyboard.press('Enter');
    }
    await page.keyboard.type(first.targets.at(-1)!.slice(0, 3).toLowerCase());
    await page.waitForTimeout(1200);
    await shot(page, 'escritorio');
  });
});

test('a Contrarreloj run', async ({ page }) => {
  await page.addInitScript(() => (Math.random = () => 0.5));
  await open(page);
  await page.getByRole('button', { name: /^Contrarreloj/ }).click();
  const wheel = trialWheel(0.5);
  for (const word of wheel.targets.slice(0, 2)) await drawWord(page, word);
  await page.waitForTimeout(1200);
  await shot(page, 'contrarreloj');
});
