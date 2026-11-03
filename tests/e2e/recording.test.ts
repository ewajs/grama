import { expect, test, type Page } from '@playwright/test';
import { assessmentRecords } from './records';
import type { PuzzlePayload, PuzzleResult } from '../../src/app/assessment/puzzle';
import { level, todaysDaily } from './level';
import { drawWord } from './wheel';
import { enterGame, openGame } from './app';
import { NEW_PROGRESS } from '../../src/core/progress';
import { NEW_SESSION } from '../../src/core/session';
import { saveGame } from '../../src/storage/save';

test.use({ storageState: { cookies: [], origins: [] } });
const records = (page: Page) => assessmentRecords<PuzzlePayload, PuzzleResult>(page);

async function freshGame(page: Page, frozenClock = false) {
  await openGame(page);
  await page.getByRole('button', { name: 'Saltear' }).click();
  if (frozenClock) await page.clock.runFor(300);
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect.poll(async () => (await records(page)).checkpoints[0]?.payload.presented).toBe(true);
}

test('recording commits exposure before presentation, captures hints and finalizes once', async ({
  page,
}) => {
  await freshGame(page);
  const first = (await records(page)).checkpoints[0]!;
  expect(first.attempt.exposures[0]?.kind).toBe('first');
  await page.getByRole('button', { name: 'Pista: te quedan 3' }).click();
  await expect
    .poll(
      async () =>
        Object.keys((await records(page)).checkpoints[0]!.payload.session.revealed).length,
    )
    .toBe(1);
  for (const word of level(1).targets) await drawWord(page, word);
  await expect.poll(async () => (await records(page)).attempts.length).toBe(1);
  const completed = await records(page);
  expect(completed.checkpoints).toHaveLength(0);
  expect(completed.attempts[0]?.attempt).toMatchObject({
    id: first.attempt.id,
    status: 'completed',
    timing: 'reliable',
    result: { kind: 'puzzle' },
  });
  expect(completed.attempts[0]?.payload.session.found).toEqual(level(1).targets);
  await page.reload();
  await enterGame(page);
  await expect(page.getByRole('dialog', { name: '¡Bien ahí!' })).toBeVisible();
  expect((await records(page)).attempts).toHaveLength(1);
});

test('recording pauses for overlays and resumes the same attempt after leaving and reload', async ({
  page,
}) => {
  // Native IndexedDB setup must finish before the controlled clock consumes its
  // preparation budget. Keep fake time frozen during IO, then advance only the UI fades.
  const start = new Date('2026-11-03T12:00:00Z');
  await page.clock.install({ time: start });
  await page.clock.pauseAt(start);
  await freshGame(page, true);
  const original = (await records(page)).checkpoints[0]!;
  await page.clock.runFor(2000);
  await page.getByRole('button', { name: 'Abrir el menú' }).click();
  await expect.poll(async () => (await records(page)).checkpoints[0]?.clock.state).toBe('paused');
  const paused = (await records(page)).checkpoints[0]!.clock.activeMs;
  await page.clock.runFor(20000);
  expect((await records(page)).checkpoints[0]?.clock.activeMs).toBe(paused);
  await page.getByRole('button', { name: 'Volver al juego' }).click();
  await page.clock.runFor(300);
  await expect(page.getByRole('dialog')).toBeHidden();
  await drawWord(page, level(1).targets[0]!);
  await expect
    .poll(async () => (await records(page)).checkpoints[0]?.payload.session.found.length)
    .toBe(1);
  await page.getByRole('button', { name: 'Volver al inicio' }).click();
  await expect.poll(async () => (await records(page)).checkpoints[0]?.clock.state).toBe('paused');
  await page.reload();
  await enterGame(page);
  await expect.poll(async () => (await records(page)).checkpoints[0]?.clock.state).toBe('running');
  const resumed = (await records(page)).checkpoints[0]!;
  expect(resumed.attempt.id).toBe(original.attempt.id);
  expect(resumed.attempt.timing).toBe('reliable');
  expect(resumed.payload.session.found).toContain(level(1).targets[0]);
});

test('recording marks an unmeasured reload gap uncertain without losing the encounter', async ({
  page,
}) => {
  await freshGame(page);
  await drawWord(page, level(1).targets[0]!);
  await expect
    .poll(async () => (await records(page)).checkpoints[0]?.payload.session.found.length)
    .toBe(1);
  const id = (await records(page)).checkpoints[0]!.attempt.id;
  // Simulate shutdown preventing the final pause/checkpoint transaction from being written.
  await page.evaluate(() => {
    IDBDatabase.prototype.transaction = function () {
      throw new DOMException('Shutdown', 'InvalidStateError');
    };
  });
  await page.reload();
  await enterGame(page);
  await expect.poll(async () => (await records(page)).checkpoints[0]?.payload.presented).toBe(true);
  const resumed = (await records(page)).checkpoints[0]!;
  expect(resumed.attempt.id).toBe(id);
  expect(resumed.attempt.timing).toBe('uncertain');
});

test('recording treats map replays as practice encounters', async ({ page }) => {
  await freshGame(page);
  for (const word of level(1).targets) await drawWord(page, word);
  await page.getByRole('button', { name: 'Siguiente nivel' }).click();
  await page.getByRole('button', { name: 'Volver al inicio' }).click();
  await page.getByRole('button', { name: /^Mapa/ }).click();
  await page.getByRole('button', { name: 'Jugar el nivel 1' }).click();
  await expect
    .poll(
      async () =>
        (await records(page)).checkpoints.find((cp) => cp.payload.replay)?.attempt.exposures[0]
          ?.kind,
    )
    .toBe('repeat');
});

test('recording retains yesterday’s daily and creates the new day’s encounter after midnight', async ({
  page,
}) => {
  await page.clock.install({ time: new Date(2026, 9, 19, 23, 59) });
  await freshGame(page);
  await page.getByRole('button', { name: 'Volver al inicio' }).click();
  await page.getByRole('button', { name: /^Desafío del día/ }).click();
  await expect
    .poll(async () =>
      (await records(page)).checkpoints.some((cp) => cp.payload.place.kind === 'daily'),
    )
    .toBe(true);
  await page.clock.setSystemTime(new Date(2026, 9, 20, 0, 1));
  await expect(page.getByText('Desafío #1', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Volver al inicio' }).click();
  await page.getByRole('button', { name: /^Desafío del día/ }).click();
  await expect(page.getByText('Desafío #2', { exact: true })).toBeVisible();
  await expect
    .poll(
      async () =>
        (await records(page)).checkpoints.filter((cp) => cp.payload.place.kind === 'daily').length,
    )
    .toBe(2);
});

test('recording failures leave ordinary play and saved progress available', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'indexedDB', {
      get() {
        throw new DOMException('Blocked', 'SecurityError');
      },
    });
  });
  await openGame(page);
  await page.getByRole('button', { name: 'Saltear' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  const word = level(1).targets[0]!;
  await drawWord(page, word);
  await expect(page.getByLabel('Puntos')).toHaveText(String(word.length * 10));
  expect(await page.evaluate(() => localStorage.getItem('grama.save'))).toContain(word);
});

test('recording stops a conflicting tab without blocking its gameplay', async ({
  page,
  context,
}) => {
  await freshGame(page);
  await drawWord(page, level(1).targets[0]!);
  await expect
    .poll(async () => (await records(page)).checkpoints[0]?.payload.session.found.length)
    .toBe(1);
  const second = await context.newPage();
  await openGame(second);
  await expect(second.locator('[data-letter]').first()).toBeVisible();
  await expect
    .poll(async () => (await records(second)).checkpoints[0]?.attempt.timing)
    .toBe('uncertain');
  await drawWord(page, level(1).targets[1]!);
  await expect(page.getByLabel('Puntos')).toHaveText(
    String((level(1).targets[0]!.length + level(1).targets[1]!.length) * 10),
  );
  expect((await records(second)).checkpoints[0]?.payload.session.found).toEqual([
    level(1).targets[0],
  ]);
});

test('recording completes a daily separately from the current numbered level', async ({ page }) => {
  await freshGame(page);
  await page.getByRole('button', { name: 'Volver al inicio' }).click();
  await page.getByRole('button', { name: /^Desafío del día/ }).click();
  for (const word of todaysDaily().level.targets) await drawWord(page, word);
  await expect.poll(async () => (await records(page)).attempts.length).toBe(1);
  const data = await records(page);
  expect(data.attempts[0]?.attempt).toMatchObject({ mode: 'daily', status: 'completed' });
  expect(data.checkpoints[0]?.payload.place).toMatchObject({ kind: 'level', levelNumber: 1 });
});

test('recording marks a legacy partial save as unknown and untimed', async ({ page }) => {
  const word = level(1).targets[0]!;
  let saved = '';
  saveGame(
    {
      ...NEW_PROGRESS,
      score: word.length * 10,
      session: { ...NEW_SESSION, found: [word], points: word.length * 10 },
    },
    {
      setItem: (_key, value) => {
        saved = value;
      },
    },
  );
  await page.addInitScript((save) => localStorage.setItem('grama.save', save), saved);
  await freshGame(page);
  const current = (await records(page)).checkpoints[0]!;
  expect(current.attempt.timing).toBe('uncertain');
  expect(current.attempt.exposures[0]?.kind).toBe('unknown');
  expect(current.payload.session.found).toEqual([word]);
});

test('recording timeout does not hold gameplay indefinitely', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(indexedDB, 'open', { value: () => ({}) as IDBOpenDBRequest });
  });
  await openGame(page);
  await page.getByRole('button', { name: 'Saltear' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await drawWord(page, level(1).targets[0]!);
  await expect(page.getByLabel('Puntos')).toHaveText(String(level(1).targets[0]!.length * 10));
});

test('recording remains paused while hidden after an overlay closes', async ({ page }) => {
  await page.clock.install();
  await freshGame(page);
  await page.getByRole('button', { name: 'Abrir el menú' }).click();
  await expect.poll(async () => (await records(page)).checkpoints[0]?.clock.state).toBe('paused');
  const paused = (await records(page)).checkpoints[0]!.clock.activeMs;
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.getByRole('button', { name: 'Volver al juego' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await page.clock.runFor(10000);
  expect((await records(page)).checkpoints[0]?.clock).toMatchObject({
    state: 'paused',
    activeMs: paused,
  });
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(async () => (await records(page)).checkpoints[0]?.clock.state).toBe('running');
});

test('recording starts a new practice encounter on reset and preserves prior exposure', async ({
  page,
}) => {
  await freshGame(page);
  await drawWord(page, level(1).targets[0]!);
  await expect
    .poll(async () => (await records(page)).checkpoints[0]?.payload.session.found.length)
    .toBe(1);
  const id = (await records(page)).checkpoints[0]!.attempt.id;
  await page.getByRole('button', { name: 'Abrir el menú' }).click();
  await page.getByRole('button', { name: 'Acerca de' }).click();
  await page.getByRole('button', { name: 'Empezar de cero' }).click();
  await page.getByRole('button', { name: 'Sí, empezar de cero' }).click();
  await expect.poll(async () => (await records(page)).attempts.length).toBe(1);
  await expect
    .poll(async () => (await records(page)).checkpoints[0]?.attempt.exposures[0]?.kind)
    .toBe('repeat');
  const data = await records(page);
  expect(data.attempts[0]?.attempt).toMatchObject({ id, status: 'abandoned' });
  expect(data.checkpoints[0]?.attempt.id).not.toBe(id);
  expect(data.checkpoints[0]?.payload.session.found).toEqual([]);
});

test('recording recovery does not call missing exposure history fresh', async ({
  page,
  context,
}) => {
  await freshGame(page);
  await page.getByRole('button', { name: 'Volver al inicio' }).click();
  const missing = await context.newPage();
  await missing.addInitScript(() => {
    Object.defineProperty(window, 'indexedDB', {
      get() {
        throw new DOMException('Blocked', 'SecurityError');
      },
    });
  });
  await openGame(missing);
  for (const word of level(1).targets) await drawWord(missing, word);
  await missing.close();
  await page.reload();
  await enterGame(page);
  await page.getByRole('button', { name: 'Siguiente nivel' }).click();
  await expect
    .poll(
      async () =>
        (await records(page)).checkpoints.find(
          (cp) => cp.payload.place.kind === 'level' && cp.payload.place.levelNumber === 2,
        )?.attempt.exposures[0]?.kind,
    )
    .toBe('unknown');
});

test('recorded trial wheels preserve exposure coverage for later numbered levels', async ({
  page,
}) => {
  await freshGame(page);
  for (const word of level(1).targets) await drawWord(page, word);
  await page.getByRole('button', { name: 'Siguiente nivel' }).click();
  await page.getByRole('button', { name: 'Volver al inicio' }).click();
  await page.getByRole('button', { name: /^Contrarreloj/ }).click();
  await expect(page.locator('[data-letter]').first()).toBeVisible();
  await page.getByRole('button', { name: 'Volver al inicio' }).click();
  // Complete coverage survives recorded trial play; unseen numbered content stays first.
  await enterGame(page);
  for (const word of level(2).targets) await drawWord(page, word);
  await page.getByRole('button', { name: 'Siguiente nivel' }).click();
  await expect
    .poll(
      async () =>
        (await records(page)).checkpoints.find(
          (cp) => cp.payload.place.kind === 'level' && cp.payload.place.levelNumber === 3,
        )?.attempt.exposures[0]?.kind,
    )
    .toBe('first');
});
