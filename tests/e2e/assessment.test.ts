import { expect, test } from '@playwright/test';
import { build } from 'vite';
import type { Checkpoint } from '../../src/storage/assessment-record';
import type { AssessmentResult, AssessmentStore } from '../../src/storage/assessment';

type Payload = { found: string[] };
declare global {
  interface Window {
    assessment: typeof import('../../src/storage/assessment');
    fixture: Checkpoint<Payload>;
    openAssessment: () => Promise<AssessmentResult<AssessmentStore<Payload>>>;
  }
}

let code = '';
test.beforeAll(async () => {
  // Serve the actual storage module as a browser bundle without adding a test entry to the app.
  const result = await build({
    configFile: false,
    logLevel: 'silent',
    build: {
      write: false,
      lib: { entry: 'src/storage/assessment.ts', formats: ['es'] },
    },
  });
  const bundle = Array.isArray(result) ? result[0] : result;
  if (!bundle || !('output' in bundle)) throw new Error('Expected one storage bundle');
  code = bundle.output
    .filter((chunk) => chunk.type === 'chunk')
    .map((chunk) => chunk.code)
    .join('\n');
});

test.beforeEach(async ({ page }) => {
  await page.route('**/assessment-module.js', (route) =>
    route.fulfill({ contentType: 'text/javascript', body: code }),
  );
  await page.goto('./');
  await page.evaluate(async () => {
    const url = new URL('./assessment-module.js', location.href).href;
    window.assessment = (await import(url)) as typeof window.assessment;
    window.openAssessment = () =>
      window.assessment.openAssessment(
        (value: unknown): value is Payload =>
          typeof value === 'object' &&
          value !== null &&
          'found' in value &&
          Array.isArray(value.found) &&
          value.found.every((word) => typeof word === 'string'),
        { name: 'assessment-test' },
      );
    window.fixture = {
      version: 1,
      attempt: {
        id: 'a',
        sequence: 0,
        game: 'grama',
        track: 'solving',
        mode: 'level',
        rulesVersion: '1',
        contentVersion: '2',
        startedAt: 1,
        activeMs: 50,
        timing: 'reliable',
        status: 'active',
        exposures: [{ encounterId: 'e0', key: 'wheel', kind: 'first' }],
      },
      clock: { state: 'paused', activeMs: 50, timing: 'reliable' },
      payload: { found: ['SOL'] },
    };
  });
});

test('assessment checkpoints and exposure survive closing and reopening', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const opened = await window.openAssessment();
    if (!opened.ok) throw new Error(opened.error);
    const saved = await opened.value.saveCheckpoint(window.fixture);
    opened.value.close();
    const reopened = await window.openAssessment();
    if (!reopened.ok) throw new Error(reopened.error);
    const loaded = await reopened.value.loadCheckpoint('a');
    const exposures = await reopened.value.exposures('wheel');
    reopened.value.close();
    return { saved, loaded, exposures };
  });
  expect(result.saved).toEqual(result.loaded);
  expect(result.loaded).toMatchObject({
    ok: true,
    value: { payload: { found: ['SOL'] }, clock: { activeMs: 50 } },
  });
  expect(result.exposures).toEqual({
    ok: true,
    value: [{ encounterId: 'e0', key: 'wheel', kind: 'first' }],
  });
});

test('assessment transaction conflict rolls back earlier exposure writes', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const opened = await window.openAssessment();
    if (!opened.ok) throw new Error(opened.error);
    const store = opened.value;
    await store.saveCheckpoint(window.fixture);
    const conflicting = structuredClone(window.fixture);
    conflicting.attempt.id = 'b';
    conflicting.attempt.exposures = [
      { encounterId: 'e1', key: 'new-wheel', kind: 'first' },
      { encounterId: 'e0', key: 'changed-wheel', kind: 'first' },
    ];
    const saved = await store.saveCheckpoint(conflicting);
    const result = {
      saved,
      exposures: await store.exposures('new-wheel'),
      checkpoint: await store.loadCheckpoint('b'),
    };
    store.close();
    return result;
  });
  expect(result).toEqual({
    saved: { ok: false, error: 'conflict' },
    exposures: { ok: true, value: [] },
    checkpoint: { ok: true, value: null },
  });
});

test('assessment concurrent encounters cannot both claim first exposure', async ({ page }) => {
  const kinds = await page.evaluate(async () => {
    const a = await window.openAssessment(),
      b = await window.openAssessment();
    if (!a.ok || !b.ok) throw new Error('Open failed');
    const other = structuredClone(window.fixture);
    other.attempt.id = 'b';
    other.attempt.exposures = [{ encounterId: 'e1', key: 'wheel', kind: 'first' }];
    const results = await Promise.all([
      a.value.saveCheckpoint(window.fixture),
      b.value.saveCheckpoint(other),
    ]);
    a.value.close();
    b.value.close();
    return results
      .map((result) => (result.ok ? result.value.attempt.exposures[0]?.kind : result.error))
      .sort();
  });
  expect(kinds).toEqual(['first', 'repeat']);
});

test('assessment rejects malformed records and handles unavailable or closed storage', async ({
  page,
}) => {
  const result = await page.evaluate(async () => {
    const opened = await window.openAssessment();
    if (!opened.ok) throw new Error(opened.error);
    const invalid = structuredClone(window.fixture);
    invalid.clock.activeMs = -1;
    const saved = await opened.value.saveCheckpoint(invalid);
    const missing = await opened.value.loadCheckpoint('a');
    opened.value.close();
    const closed = await opened.value.loadCheckpoint('a');
    const unavailable = await window.assessment.openAssessment(
      (value: unknown): value is never => {
        void value;
        return false;
      },
      {
        factory: () => {
          throw new Error('SecurityError');
        },
      },
    );
    return { saved, missing, closed, unavailable };
  });
  expect(result).toEqual({
    saved: { ok: false, error: 'invalid-data' },
    missing: { ok: true, value: null },
    closed: { ok: false, error: 'failed' },
    unavailable: { ok: false, error: 'unavailable' },
  });
});

test('assessment keeps newer schemas intact', async ({ page }) => {
  const result = await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('assessment-test', 2);
      request.onsuccess = () => {
        request.result.close();
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
    return window.openAssessment();
  });
  expect(result).toEqual({ ok: false, error: 'unsupported-version' });
});

test('assessment validates records read back from IndexedDB', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const opened = await window.openAssessment();
    if (!opened.ok) throw new Error(opened.error);
    opened.value.close();
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('assessment-test');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result,
          tx = db.transaction('checkpoints', 'readwrite');
        tx.objectStore('checkpoints').put({ ...window.fixture, payload: [null] });
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onabort = () => {
          db.close();
          reject(tx.error);
        };
      };
    });
    const reopened = await window.openAssessment();
    if (!reopened.ok) throw new Error(reopened.error);
    const result = await reopened.value.loadCheckpoint('a');
    reopened.value.close();
    return result;
  });
  expect(result).toEqual({ ok: false, error: 'invalid-data' });
});

test('assessment blocked opens return promptly and do not leave a late connection behind', async ({
  page,
}) => {
  const result = await page.evaluate(async () => {
    const held = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('blocked-test');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    // Request a real upgrade while another tab/connection holds the old database open.
    const result = await window.assessment.openAssessment(
      (value: unknown): value is never => {
        void value;
        return false;
      },
      {
        name: 'blocked-test',
        factory: () => ({ open: (name: string) => indexedDB.open(name, 2) }) as IDBFactory,
      },
    );
    held.close();
    const version = await new Promise<number>((resolve, reject) => {
      const request = indexedDB.open('blocked-test');
      request.onsuccess = () => {
        const db = request.result;
        const version = db.version;
        db.close();
        resolve(version);
      };
      request.onerror = () => reject(request.error);
    });
    return { result, version };
  });
  expect(result).toEqual({ result: { ok: false, error: 'blocked' }, version: 1 });
});
