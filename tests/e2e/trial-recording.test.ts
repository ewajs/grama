import { expect, test, type Page } from '@playwright/test';
import { assessmentRecords } from './records';
import { trialWheel } from './level';
import { drawWord } from './wheel';
import type { GramaPayload } from '../../src/app/assessment/payload';
import type { GramaResult } from '../../src/app/assessment/grama';

declare global {
  interface Window {
    releaseAssessmentLock: () => void;
  }
}

const records = (page: Page) => assessmentRecords<GramaPayload, GramaResult>(page);
test.use({ storageState: { cookies: [], origins: [] } });
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => (Math.random = () => 0.5));
});
async function enterTrial(page: Page) {
  await page.getByRole('button', { name: /^Contrarreloj/ }).click();
  await expect(page.getByRole('timer')).toBeVisible();
}
async function openTrial(page: Page) {
  await page.goto('./');
  await enterTrial(page);
  await expect
    .poll(async () => (await records(page)).checkpoints.at(-1)?.payload.presented)
    .toBe(true);
}

test('trial recording retains cleared and skipped wheels and finalizes only once at time-up', async ({
  page,
}) => {
  await page.clock.install();
  await openTrial(page);
  const first = (await records(page)).checkpoints[0]!;
  expect(first.attempt).toMatchObject({
    track: 'time-trial',
    mode: 'trial',
    exposures: [{ kind: 'first' }],
  });
  const targets = trialWheel(0.5).targets;
  for (const word of targets) await drawWord(page, word);
  await expect(page.getByText('Rueda 2')).toBeVisible();
  await page.getByRole('button', { name: /^Pasar/ }).click();
  await expect(page.getByText('Rueda 3')).toBeVisible();
  await page.clock.fastForward(120000);
  await expect(page.getByRole('dialog')).toContainText('¡Tiempo!');
  await expect.poll(async () => (await records(page)).attempts.length).toBe(1);
  const completed = (await records(page)).attempts[0]!;
  expect(completed.attempt).toMatchObject({
    id: first.attempt.id,
    status: 'completed',
    result: { kind: 'trial', run: { cleared: 1, words: targets.length }, skipped: 1 },
  });
  expect(completed.attempt.exposures).toHaveLength(3);
  if (!('kind' in completed.payload)) throw new Error('Expected trial payload');
  expect(completed.payload.wheels.map((wheel) => wheel.outcome)).toEqual([
    'cleared',
    'skipped',
    'current',
  ]);
  expect(completed.payload.wheels[0]!.session.found).toEqual(targets);
  expect(completed.payload.wheels.every((wheel) => wheel.descriptor.score !== null)).toBe(true);
  await page.getByRole('button', { name: 'Volver al inicio', exact: true }).last().click();
  await page.reload();
  expect((await records(page)).attempts).toHaveLength(1);
});

test('trial recording abandons leaving and gives the same-seed restart repeated exposure', async ({
  page,
}) => {
  await openTrial(page);
  const id = (await records(page)).checkpoints[0]!.attempt.id;
  await drawWord(page, trialWheel(0.5).targets[0]!);
  await page.getByRole('button', { name: 'Volver al inicio', exact: true }).click();
  await expect
    .poll(async () => (await records(page)).attempts[0]?.attempt.status)
    .toBe('abandoned');
  await enterTrial(page);
  await expect
    .poll(async () => (await records(page)).checkpoints[0]?.attempt.exposures[0]?.kind)
    .toBe('repeat');
  expect((await records(page)).checkpoints[0]!.attempt.id).not.toBe(id);
  expect((await records(page)).attempts[0]!.payload).toMatchObject({ words: 1 });
});

test('trial play-again creates another attempt even when the seed repeats', async ({ page }) => {
  await page.clock.install();
  await openTrial(page);
  await page.clock.fastForward(65000);
  await expect.poll(async () => (await records(page)).attempts.length).toBe(1);
  await page.getByRole('button', { name: 'Otra vez' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByRole('timer')).toHaveText('1:00');
  await expect.poll(async () => (await records(page)).checkpoints[0]?.clock.state).toBe('running');
  const data = await records(page);
  expect(data.checkpoints[0]!.attempt.id).not.toBe(data.attempts[0]!.attempt.id);
  expect(data.checkpoints[0]!.attempt.exposures[0]!.kind).toBe('repeat');
});

test('trial countdown and recorded active time pause together while hidden', async ({ page }) => {
  await page.clock.install();
  await openTrial(page);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(async () => (await records(page)).checkpoints[0]?.clock.state).toBe('paused');
  const paused = (await records(page)).checkpoints[0]!.clock.activeMs;
  const time = await page.getByRole('timer').innerText();
  await page.clock.runFor(20000);
  expect((await records(page)).checkpoints[0]!.clock.activeMs).toBe(paused);
  await expect(page.getByRole('timer')).toHaveText(time);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(async () => (await records(page)).checkpoints[0]?.clock.state).toBe('running');
  expect((await records(page)).checkpoints[0]!.attempt.timing).toBe('reliable');
});

test('trial tabs use separate attempts and serialize first exposure classification', async ({
  page,
  context,
}) => {
  await openTrial(page);
  const second = await context.newPage();
  await second.addInitScript(() => (Math.random = () => 0.5));
  await openTrial(second);
  const data = await records(page);
  expect(data.checkpoints).toHaveLength(2);
  expect(new Set(data.checkpoints.map((cp) => cp.attempt.id)).size).toBe(2);
  expect(data.checkpoints.flatMap((cp) => cp.attempt.exposures.map((e) => e.kind)).sort()).toEqual([
    'first',
    'repeat',
  ]);
  await second.getByRole('button', { name: 'Volver al inicio', exact: true }).click();
  await page.getByRole('button', { name: 'Volver al inicio', exact: true }).click();
  await expect.poll(async () => (await records(page)).attempts.length).toBe(2);
});

test('trial reload never resumes or completes an interrupted run', async ({ page }) => {
  await openTrial(page);
  const id = (await records(page)).checkpoints[0]!.attempt.id;
  await page.evaluate(() => {
    IDBDatabase.prototype.transaction = function () {
      throw new DOMException('Shutdown', 'InvalidStateError');
    };
  });
  await page.reload();
  await enterTrial(page);
  await expect.poll(async () => (await records(page)).checkpoints.length).toBe(2);
  const data = await records(page);
  expect(data.attempts).toHaveLength(0);
  expect(data.checkpoints.find((cp) => cp.attempt.id !== id)?.attempt.exposures[0]?.kind).toBe(
    'repeat',
  );
});

test('trial recording unavailable still allows countdown, submissions and wheel changes', async ({
  page,
}) => {
  await page.clock.install();
  await page.addInitScript(() =>
    Object.defineProperty(window, 'indexedDB', {
      get() {
        throw new DOMException('Blocked', 'SecurityError');
      },
    }),
  );
  await page.goto('./');
  await enterTrial(page);
  await page.clock.fastForward(5000);
  await expect(page.getByRole('timer')).toContainText('0:55');
  const word = trialWheel(0.5).targets[0]!;
  await drawWord(page, word);
  await expect(page.getByLabel('Puntos')).toHaveText(String(word.length * 10));
  await page.getByRole('button', { name: /^Pasar/ }).click();
  await expect(page.getByText('Rueda 2')).toBeVisible();
});

test('a pending wheel exposure pauses the countdown and hides the next board', async ({ page }) => {
  await page.clock.install();
  await openTrial(page);
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('grama.assessment');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const tx = db.transaction('checkpoints', 'readwrite');
          let held = true;
          const keepAlive = () => {
            const read = tx.objectStore('checkpoints').get('lock');
            read.onsuccess = () => {
              if (held) keepAlive();
            };
          };
          window.releaseAssessmentLock = () => (held = false);
          tx.oncomplete = () => db.close();
          keepAlive();
          resolve();
        };
      }),
  );
  await page.getByRole('button', { name: /^Pasar/ }).click();
  await expect(page.locator('[data-letter]')).toHaveCount(0);
  await page.clock.runFor(1000);
  await expect(page.locator('[data-letter]')).toHaveCount(0);
  await page.evaluate(() => window.releaseAssessmentLock());
  await expect(page.getByText('Rueda 2')).toBeVisible();
  await expect(page.getByRole('timer')).toHaveText('0:50');
  await expect
    .poll(async () => (await records(page)).checkpoints[0]?.attempt.exposures.length)
    .toBe(2);
  expect((await records(page)).checkpoints[0]!.attempt.timing).toBe('reliable');
});
