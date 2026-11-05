import { expect, test } from '@playwright/test';
import { build } from 'vite';
import type { Checkpoint, Finalized } from '../../src/storage/assessment-record';
import type { AssessmentResult, AssessmentStore } from '../../src/storage/assessment';

type Payload = { found: string[] };
declare global {
  interface Window {
    assessment: typeof import('../../src/storage/assessment');
    fixture: Checkpoint<Payload>;
    complete: (checkpoint: Checkpoint<Payload>, result?: number) => Finalized<Payload, number>;
    openAssessment: () => Promise<AssessmentResult<AssessmentStore<Payload, number>>>;
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
        (value: unknown): value is number =>
          typeof value === 'number' && Number.isFinite(value) && value >= 0,
        { name: 'assessment-test' },
      );
    window.complete = (checkpoint, result = 100) => ({
      ...checkpoint,
      clock: { ...checkpoint.clock, state: 'finished' },
      attempt: { ...checkpoint.attempt, status: 'completed', endedAt: 2, result },
    });
    window.fixture = {
      version: 2,
      revision: 0,
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
    const next = structuredClone(window.fixture);
    next.attempt.id = 'c';
    next.attempt.exposures = [];
    const allocated = await store.saveCheckpoint(next);
    store.close();
    return {
      ...result,
      nextSequence: allocated.ok ? allocated.value.attempt.sequence : allocated.error,
    };
  });
  expect(result).toEqual({
    nextSequence: 2,
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
      (value: unknown): value is number => typeof value === 'number',
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
      const request = indexedDB.open('assessment-test', 3);
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
      (value: unknown): value is number => typeof value === 'number',
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

test('assessment admits only one writer per checkpoint revision', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const a = await window.openAssessment(),
      b = await window.openAssessment();
    if (!a.ok || !b.ok) throw new Error('Open failed');
    const initial = await a.value.saveCheckpoint(window.fixture);
    if (!initial.ok) throw new Error(initial.error);
    const left = structuredClone(initial.value),
      right = structuredClone(initial.value);
    left.payload.found.push('SAL');
    right.payload.found.push('LOS');
    const writes = await Promise.all([a.value.saveCheckpoint(left), b.value.saveCheckpoint(right)]);
    const loaded = await a.value.loadCheckpoint('a');
    a.value.close();
    b.value.close();
    return { writes, loaded };
  });
  expect(result.writes.filter((write) => write.ok)).toHaveLength(1);
  expect(result.writes.filter((write) => !write.ok)).toEqual([{ ok: false, error: 'conflict' }]);
  expect(result.loaded).toMatchObject({
    ok: true,
    value: { revision: 2, attempt: { sequence: 1 } },
  });
});

test('assessment finalization is immutable and identical concurrent retries succeed', async ({
  page,
}) => {
  const result = await page.evaluate(async () => {
    const a = await window.openAssessment(),
      b = await window.openAssessment();
    if (!a.ok || !b.ok) throw new Error('Open failed');
    const saved = await a.value.saveCheckpoint(window.fixture);
    if (!saved.ok) throw new Error(saved.error);
    const complete = window.complete(saved.value);
    const finishes = await Promise.all([a.value.finalize(complete), b.value.finalize(complete)]);
    const changed = await b.value.finalize(window.complete(saved.value, 200));
    const stale = await b.value.saveCheckpoint(saved.value);
    const result = {
      finishes,
      changed,
      stale,
      checkpoint: await a.value.loadCheckpoint('a'),
      recorded: await a.value.loadAttempt('a'),
      history: await a.value.history(),
    };
    a.value.close();
    b.value.close();
    return result;
  });
  expect(result.finishes[0]).toEqual(result.finishes[1]);
  expect(result.finishes[0]).toMatchObject({
    ok: true,
    value: { revision: 2, attempt: { status: 'completed', result: 100, sequence: 1 } },
  });
  expect(result.changed).toEqual({ ok: false, error: 'conflict' });
  expect(result.stale).toEqual({ ok: false, error: 'conflict' });
  expect(result.checkpoint).toEqual({ ok: true, value: null });
  expect(result.recorded).toEqual(result.finishes[0]);
  expect(result.history.ok && result.history.value).toHaveLength(1);
});

test('assessment conflicting finalizations have one winner', async ({ page }) => {
  const outcomes = await page.evaluate(async () => {
    const a = await window.openAssessment(),
      b = await window.openAssessment();
    if (!a.ok || !b.ok) throw new Error('Open failed');
    const saved = await a.value.saveCheckpoint(window.fixture);
    if (!saved.ok) throw new Error(saved.error);
    const writes = await Promise.all([
      a.value.finalize(window.complete(saved.value, 1)),
      b.value.finalize(window.complete(saved.value, 2)),
    ]);
    a.value.close();
    b.value.close();
    return writes.map((write) => (write.ok ? 'saved' : write.error)).sort();
  });
  expect(outcomes).toEqual(['conflict', 'saved']);
});

test('assessment allocates sequences once and reads history by creation sequence', async ({
  page,
}) => {
  const result = await page.evaluate(async () => {
    const opened = await window.openAssessment();
    if (!opened.ok) throw new Error(opened.error);
    const store = opened.value,
      other = structuredClone(window.fixture);
    other.attempt.id = 'b';
    other.attempt.exposures = [{ key: 'other', encounterId: 'e1', kind: 'first' }];
    const [a, b] = await Promise.all([
      store.saveCheckpoint(window.fixture),
      store.saveCheckpoint(other),
    ]);
    if (!a.ok || !b.ok) throw new Error('Save failed');
    await store.finalize(window.complete(b.value));
    await store.finalize(window.complete(a.value));
    const result = {
      sequences: [a.value.attempt.sequence, b.value.attempt.sequence],
      history: await store.history(),
      page: await store.history(1),
    };
    store.close();
    return result;
  });
  expect(result.sequences).toEqual([1, 2]);
  expect(result.history.ok && result.history.value.map((record) => record.attempt.id)).toEqual([
    'a',
    'b',
  ]);
  expect(result.page.ok && result.page.value.map((record) => record.attempt.id)).toEqual(['b']);
});

test('assessment rolls back a failure after inserting an outcome', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const opened = await window.openAssessment();
    if (!opened.ok) throw new Error(opened.error);
    const store = opened.value,
      saved = await store.saveCheckpoint(window.fixture);
    if (!saved.ok) throw new Error(saved.error);
    const complete = window.complete(saved.value);
    complete.attempt.exposures = [
      ...complete.attempt.exposures,
      { key: 'last-wheel', encounterId: 'last', kind: 'first' },
    ];
    const original = IDBObjectStore.prototype.delete;
    let outcome;
    try {
      IDBObjectStore.prototype.delete = function (query) {
        if (this.name === 'checkpoints')
          throw new DOMException('Injected storage failure', 'AbortError');
        return original.call(this, query);
      };
      outcome = await store.finalize(complete);
    } finally {
      IDBObjectStore.prototype.delete = original;
    }
    const result = {
      outcome,
      saved,
      checkpoint: await store.loadCheckpoint('a'),
      recorded: await store.loadAttempt('a'),
      exposures: await store.exposures('last-wheel'),
    };
    store.close();
    return result;
  });
  expect(result.outcome).toEqual({ ok: false, error: 'failed' });
  expect(result.checkpoint).toEqual(result.saved);
  expect(result.recorded).toEqual({ ok: true, value: null });
  expect(result.exposures).toEqual({ ok: true, value: [] });
});

test('assessment preserves unsupported older databases', async ({ page }) => {
  const result = await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('assessment-test', 1);
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

test('assessment retains exposure when an attempt is abandoned', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const opened = await window.openAssessment();
    if (!opened.ok) throw new Error(opened.error);
    const store = opened.value,
      saved = await store.saveCheckpoint(window.fixture);
    if (!saved.ok) throw new Error(saved.error);
    const abandoned: Finalized<Payload, number> = {
      ...saved.value,
      clock: { ...saved.value.clock, state: 'finished' },
      attempt: { ...saved.value.attempt, status: 'abandoned', endedAt: 2 },
    };
    const result = {
      saved: await store.finalize(abandoned),
      exposures: await store.exposures('wheel'),
    };
    store.close();
    return result;
  });
  expect(result.saved).toMatchObject({ ok: true, value: { attempt: { status: 'abandoned' } } });
  expect(result.exposures).toEqual({
    ok: true,
    value: [{ encounterId: 'e0', key: 'wheel', kind: 'first' }],
  });
});

test('assessment cannot reuse an encounter owned by another attempt', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const opened = await window.openAssessment();
    if (!opened.ok) throw new Error(opened.error);
    const store = opened.value;
    await store.saveCheckpoint(window.fixture);
    const other = structuredClone(window.fixture);
    other.attempt.id = 'b';
    const result = await store.saveCheckpoint(other);
    store.close();
    return result;
  });
  expect(result).toEqual({ ok: false, error: 'conflict' });
});

test('assessment snapshot includes finalized evidence, unfinished state and exposure ownership', async ({
  page,
}) => {
  const result = await page.evaluate(async () => {
    const opened = await window.openAssessment();
    if (!opened.ok) throw new Error(opened.error);
    const store = opened.value;
    const first = await store.saveCheckpoint(window.fixture);
    if (!first.ok) throw new Error(first.error);
    const completed = await store.finalize(window.complete(first.value));
    const second = structuredClone(window.fixture);
    second.attempt.id = 'b';
    second.attempt.exposures = [{ encounterId: 'e1', key: 'wheel', kind: 'first' }];
    const pending = await store.saveCheckpoint(second);
    const snapshot = await store.snapshot();
    store.close();
    return { completed, pending, snapshot, closed: await store.snapshot() };
  });
  expect(result.snapshot).toEqual({
    ok: true,
    value: {
      version: 2,
      records: [result.completed.ok && result.completed.value],
      checkpoints: [result.pending.ok && result.pending.value],
      exposures: [
        { encounterId: 'e0', key: 'wheel', kind: 'first', attemptId: 'a' },
        { encounterId: 'e1', key: 'wheel', kind: 'repeat', attemptId: 'b' },
      ],
      sequence: 2,
    },
  });
  expect(result.closed).toEqual({ ok: false, error: 'failed' });
});
