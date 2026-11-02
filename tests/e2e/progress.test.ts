import { expect, test } from '@playwright/test';
import { describeTrial, trialResult } from '../../src/app/assessment/trial';
import { GRAMA_RULES, puzzleIdentity } from '../../src/app/assessment/grama';
import type { GramaRecord } from '../../src/app/assessment/payload';
import { NEW_PROGRESS } from '../../src/core/progress';
import { saveGame } from '../../src/storage/save';
import { NEW_SESSION } from '../../src/core/session';
import { evaluate } from '../../src/core/evaluate';
import { LEVELS_VERSION } from '../../src/core/generate';
import { trialWheel, level } from './level';
import { drawWord } from './wheel';

test.use({ storageState: { cookies: [], origins: [] } });

function historyFixture(): GramaRecord[] {
  const records: GramaRecord[] = [],
    seen = new Set<string>();
  const wheels = [];
  for (let seed = 1; wheels.length < 20 && seed <= 2000; seed++) {
    const random = seed / 10000,
      wheel = trialWheel(random),
      key = puzzleIdentity(wheel).exposureKey;
    if (!seen.has(key)) {
      seen.add(key);
      wheels.push({ wheel, key, seed: Math.floor(random * 2 ** 31) });
    }
  }
  if (wheels.length < 20) throw new Error('Expected twenty distinct fixture wheels');
  for (let sequence = 1; sequence <= 110; sequence++) {
    const repeated = sequence > 10 && sequence <= 100;
    const selected = wheels[sequence <= 10 ? sequence - 1 : sequence > 100 ? sequence - 91 : 0]!;
    const { wheel, key, seed } = selected;
    const found = sequence > 100 ? wheel.targets.slice(0, 1) : [];
    const points = found.reduce((sum, word) => {
      const result = evaluate(wheel, [], word);
      return sum + (result.kind === 'target' || result.kind === 'bonus' ? result.points : 0);
    }, 0);
    const snapshot = {
      kind: 'trial' as const,
      seed,
      timeLeft: 0,
      points,
      cleared: 0,
      words: found.length,
      wheels: [{ level: wheel, session: { ...NEW_SESSION, found }, outcome: 'current' as const }],
    };
    const payload = describeTrial(snapshot, new Map()),
      activeMs = 60000 + found.length * 3000;
    records.push({
      version: 2,
      revision: 2,
      payload,
      clock: { state: 'finished', activeMs, timing: 'reliable' },
      attempt: {
        id: `beta-${sequence}`,
        sequence,
        game: 'grama',
        track: 'time-trial',
        mode: 'trial',
        rulesVersion: GRAMA_RULES.trial,
        contentVersion: String(LEVELS_VERSION),
        startedAt: 1793500000000 + sequence * 100000,
        endedAt: 1793500000000 + sequence * 100000 + activeMs,
        activeMs,
        timing: 'reliable',
        status: 'completed',
        result: trialResult(snapshot),
        exposures: [{ key, encounterId: `wheel-${sequence}`, kind: repeated ? 'repeat' : 'first' }],
      },
    });
  }
  return records;
}

test('beta progress opens from Home, handles an empty profile and browser back', async ({
  page,
}) => {
  await page.goto('./');
  await page.setViewportSize({ width: 375, height: 667 });
  await page.getByRole('button', { name: /^Tu progreso/ }).click();
  await expect(page.getByRole('heading', { name: 'Tu progreso', exact: true })).toBeVisible();
  await expect(
    page.getByText('Completá un nivel o una partida de Contrarreloj para ver tus resultados acá.'),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: /Contanos/ })).toHaveAttribute(
    'href',
    /github.com\/ewajs\/grama\/issues\/new/,
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.goBack();
  await expect(page.getByRole('button', { name: /^Jugar/ })).toBeVisible();
});

test('beta progress includes new play for an existing player', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem('grama.settings', JSON.stringify({ tutorialSeen: true })),
  );
  await page.goto('./');
  await page.getByRole('button', { name: /^Jugar/ }).click();
  await page.getByRole('button', { name: 'Pista: te quedan 3' }).click();
  for (const word of level(1).targets) await drawWord(page, word);
  await page.getByRole('button', { name: 'Siguiente nivel' }).click();
  await page.getByRole('button', { name: 'Volver al inicio', exact: true }).click();
  await page.getByRole('button', { name: /^Tu progreso/ }).click();
  const recent = page.getByRole('region', { name: 'Partidas recientes' });
  await expect(recent).toContainText('Nivel 1');
  await expect(recent).toContainText('1 pista');
  await expect(recent).toContainText('Comparable');
  await expect(page.getByRole('region', { name: 'Resolución de palabras' })).toContainText(
    '1 de 20',
  );
  await expect(page.getByRole('checkbox')).toHaveCount(0);
});

test('beta progress pages full history, shows comparison counts and refreshes', async ({
  page,
}, info) => {
  await page.goto('./');
  await page.getByRole('button', { name: /^Tu progreso/ }).click();
  await expect(page.getByRole('button', { name: 'Actualizar', exact: true })).toBeEnabled();
  await page.evaluate(
    (data) =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('grama.assessment');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result,
            tx = db.transaction(['attempts', 'exposures', 'meta'], 'readwrite');
          for (const record of data) {
            tx.objectStore('attempts').put(record);
            for (const exposure of record.attempt.exposures)
              tx.objectStore('exposures').put({ ...exposure, attemptId: record.attempt.id });
          }
          tx.objectStore('meta').put(data.length, 'sequence');
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onabort = () => {
            db.close();
            reject(tx.error);
          };
        };
      }),
    historyFixture(),
  );
  await page.getByRole('button', { name: 'Actualizar', exact: true }).click();
  const trial = page.getByRole('region', { name: 'Contrarreloj', exact: true });
  await expect(trial).toContainText('110 partidas completas registradas');
  await expect(trial).toContainText('100% a favor de las recientes');
  await expect(trial).toContainText('10 iniciales · 10 recientes');
  await expect(page.getByRole('region', { name: 'Partidas recientes' }).locator('li')).toHaveCount(
    10,
  );
  if (info.project.name === 'mobile')
    await page.screenshot({ path: '/tmp/grama-progress-beta.png' });
  await page.reload();
  await page.getByRole('button', { name: /^Tu progreso/ }).click();
  await expect(page.getByRole('region', { name: 'Contrarreloj', exact: true })).toContainText(
    '100% a favor de las recientes',
  );
});

test('beta progress storage failure keeps navigation and ordinary play available', async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, 'indexedDB', {
      get() {
        throw new DOMException('Blocked', 'SecurityError');
      },
    }),
  );
  await page.goto('./');
  await page.getByRole('button', { name: /^Tu progreso/ }).click();
  await expect(page.getByRole('alert')).toContainText('No pudimos leer tus partidas');
  await page.getByRole('button', { name: 'Volver al inicio', exact: true }).click();
  await page.getByRole('button', { name: /^Jugar/ }).click();
  await page.getByRole('button', { name: 'Saltear', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await drawWord(page, level(1).targets[0]!);
  await expect(page.getByLabel('Puntos')).not.toHaveText('0');
});

test('existing game progress is preserved without manufacturing past assessment history', async ({
  page,
}) => {
  let saved = '';
  saveGame(
    { ...NEW_PROGRESS, levelNumber: 24, score: 900 },
    {
      setItem: (_key, value) => {
        saved = value;
      },
    },
  );
  await page.addInitScript((value) => localStorage.setItem('grama.save', value), saved);
  await page.goto('./');
  await expect(page.getByRole('button', { name: /^Jugar.*Nivel 24/ })).toBeVisible();
  await page.getByRole('button', { name: /^Tu progreso/ }).click();
  await expect(
    page.getByText('Completá un nivel o una partida de Contrarreloj para ver tus resultados acá.'),
  ).toBeVisible();
  await expect(page.getByRole('checkbox')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('grama.save'))).toBe(saved);
  await page.getByRole('button', { name: 'Volver al inicio', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Jugar.*Nivel 24/ })).toBeVisible();
});
