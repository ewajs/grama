import { exposureFor, type Exposure } from '../core/assessment/attempt';
import {
  canAdvance,
  evidenceJson,
  isCheckpoint,
  isStoredExposure,
  isFinalized,
  type Checkpoint,
  type Finalized,
  type StoredExposure,
} from './assessment-record';
import { isCount } from './guards';

/** Explicit outcomes let the app continue play when assessment storage cannot be used. */
export type AssessmentResult<Value> =
  | { ok: true; value: Value }
  | {
      ok: false;
      error:
        'unavailable' | 'blocked' | 'unsupported-version' | 'invalid-data' | 'conflict' | 'failed';
    };

const NAME = 'grama.assessment';
const VERSION = 2;
const HISTORY_PAGE = 100;
const STORES = ['checkpoints', 'attempts', 'exposures', 'meta'];

/** One consistent copy of all persisted recording state, including replay recognition. */
export type AssessmentSnapshot<Payload, Result> = {
  version: 2;
  records: Finalized<Payload, Result>[];
  checkpoints: Checkpoint<Payload>[];
  exposures: StoredExposure[];
  sequence: number;
};

function validSchema(db: IDBDatabase): boolean {
  if (!STORES.every((name) => db.objectStoreNames.contains(name))) return false;
  try {
    const tx = db.transaction(STORES);
    const exposures = tx.objectStore('exposures');
    const attempts = tx.objectStore('attempts');
    return (
      tx.objectStore('checkpoints').keyPath === 'attempt.id' &&
      tx.objectStore('checkpoints').index('sequence').keyPath === 'attempt.sequence' &&
      tx.objectStore('checkpoints').index('sequence').unique &&
      attempts.keyPath === 'attempt.id' &&
      attempts.index('sequence').keyPath === 'attempt.sequence' &&
      attempts.index('sequence').unique &&
      exposures.keyPath === 'encounterId' &&
      exposures.index('key').keyPath === 'key' &&
      !exposures.index('key').unique &&
      tx.objectStore('meta').keyPath === null
    );
  } catch {
    return false;
  }
}

function request<Value>(operation: IDBRequest<Value>): Promise<Value> {
  return new Promise((resolve, reject) => {
    operation.onsuccess = () => resolve(operation.result);
    operation.onerror = () => reject(operation.error);
  });
}

/** Versioned local assessment database with game-supplied evidence guards. */
export class AssessmentStore<Payload, Result> {
  #db: IDBDatabase;
  #isPayload: (value: unknown) => value is Payload;
  #isResult: (value: unknown) => value is Result;

  /** Created by openAssessment after schema checks. */
  constructor(
    db: IDBDatabase,
    isPayload: (value: unknown) => value is Payload,
    isResult: (value: unknown) => value is Result,
  ) {
    this.#db = db;
    this.#isPayload = isPayload;
    this.#isResult = isResult;
    db.onversionchange = () => db.close();
  }

  /** Releases the browser connection; subsequent operations return a failure. */
  close(): void {
    this.#db.close();
  }

  async #transaction<Value>(
    mode: IDBTransactionMode,
    work: (tx: IDBTransaction) => Promise<AssessmentResult<Value>>,
  ): Promise<AssessmentResult<Value>> {
    let tx: IDBTransaction | undefined;
    let done: Promise<boolean> | undefined;
    try {
      tx = this.#db.transaction(STORES, mode);
      done = new Promise<boolean>((resolve) => {
        if (!tx) return resolve(false);
        tx.oncomplete = () => resolve(true);
        tx.onabort = () => resolve(false);
      });
      const result = await work(tx);
      if (!result.ok) tx.abort();
      const committed = await done;
      return !result.ok || committed ? result : { ok: false, error: 'failed' };
    } catch {
      try {
        tx?.abort();
      } catch {
        /* Already closed or aborted. */
      }
      await done;
      return { ok: false, error: 'failed' };
    }
  }

  /** Reads a validated unfinished attempt. Unknown record versions are never treated as fresh. */
  loadCheckpoint(id: string): Promise<AssessmentResult<Checkpoint<Payload> | null>> {
    return this.#transaction('readonly', async (tx) => {
      const value: unknown = await request(tx.objectStore('checkpoints').get(id));
      if (value === undefined) return { ok: true, value: null };
      return isCheckpoint(value, this.#isPayload) &&
        value.revision > 0 &&
        value.attempt.sequence > 0
        ? { ok: true, value }
        : { ok: false, error: 'invalid-data' };
    });
  }

  /** Validated unfinished attempts, used to reconcile saved game sessions after a reload. */
  checkpoints(): Promise<AssessmentResult<Checkpoint<Payload>[]>> {
    return this.#transaction('readonly', async (tx) => {
      const values: unknown[] = await request(tx.objectStore('checkpoints').getAll());
      return values.every(
        (value): value is Checkpoint<Payload> =>
          isCheckpoint(value, this.#isPayload) && value.revision > 0 && value.attempt.sequence > 0,
      )
        ? { ok: true, value: values }
        : { ok: false, error: 'invalid-data' };
    });
  }

  /** Looks up all known encounters of content, across modes and app visits. */
  exposures(key: string): Promise<AssessmentResult<Exposure[]>> {
    return this.#transaction('readonly', async (tx) => {
      const values: unknown[] = await request(tx.objectStore('exposures').index('key').getAll(key));
      return values.every(isStoredExposure)
        ? {
            ok: true,
            value: values.map((entry) => ({
              encounterId: entry.encounterId,
              key: entry.key,
              kind: entry.kind,
            })),
          }
        : { ok: false, error: 'invalid-data' };
    });
  }

  async #classify(
    tx: IDBTransaction,
    attemptId: string,
    proposed: readonly Exposure[],
  ): Promise<AssessmentResult<Exposure[]>> {
    const ledger = tx.objectStore('exposures'),
      exposures: Exposure[] = [];
    for (const { key, encounterId, kind } of proposed) {
      const entry: Exposure = { key, encounterId, kind };
      const existing: unknown = await request(ledger.get(entry.encounterId));
      if (existing !== undefined) {
        if (!isStoredExposure(existing)) return { ok: false, error: 'invalid-data' };
        if (existing.key !== entry.key || existing.attemptId !== attemptId)
          return { ok: false, error: 'conflict' };
      }
      const known: unknown[] = await request(ledger.index('key').getAll(entry.key));
      if (!known.every(isStoredExposure)) return { ok: false, error: 'invalid-data' };
      const classified =
        existing === undefined && entry.kind === 'repeat'
          ? entry
          : exposureFor(
              entry.key,
              entry.encounterId,
              known.map((item) => ({
                encounterId: item.encounterId,
                key: item.key,
                kind: item.kind,
              })),
              entry.kind === 'unknown' ? 'partial' : 'complete',
            );
      exposures.push(classified);
      await request(ledger.put({ ...classified, attemptId }));
    }
    return { ok: true, value: exposures };
  }

  /** Saves only the expected revision; zero/sequence zero proposes a new attempt. */
  saveCheckpoint(value: Checkpoint<Payload>): Promise<AssessmentResult<Checkpoint<Payload>>> {
    return this.#transaction('readwrite', async (tx) => {
      value = structuredClone(value);
      if (!isCheckpoint(value, this.#isPayload)) return { ok: false, error: 'invalid-data' };
      const checkpoints = tx.objectStore('checkpoints');
      if ((await request(tx.objectStore('attempts').getKey(value.attempt.id))) !== undefined)
        return { ok: false, error: 'conflict' };
      const before: unknown = await request(checkpoints.get(value.attempt.id));
      if (
        before !== undefined &&
        (!isCheckpoint(before, this.#isPayload) ||
          before.revision < 1 ||
          before.attempt.sequence < 1)
      )
        return { ok: false, error: 'invalid-data' };
      if (
        before === undefined
          ? value.revision !== 0 || value.attempt.sequence !== 0
          : value.revision !== before.revision || !canAdvance(before, value)
      )
        return { ok: false, error: 'conflict' };
      if (!Number.isSafeInteger(value.revision + 1)) return { ok: false, error: 'invalid-data' };
      let sequence = value.attempt.sequence;
      if (before === undefined) {
        const counter: unknown = await request(tx.objectStore('meta').get('sequence'));
        if (
          typeof counter !== 'number' ||
          !Number.isSafeInteger(counter) ||
          counter < 0 ||
          !Number.isSafeInteger(counter + 1)
        )
          return { ok: false, error: 'invalid-data' };
        sequence = counter + 1;
        if (
          (await request(checkpoints.index('sequence').getKey(sequence))) !== undefined ||
          (await request(tx.objectStore('attempts').index('sequence').getKey(sequence))) !==
            undefined
        )
          return { ok: false, error: 'invalid-data' };
        await request(tx.objectStore('meta').put(sequence, 'sequence'));
      }
      const classified = await this.#classify(tx, value.attempt.id, value.attempt.exposures);
      if (!classified.ok) return classified;
      const saved = {
        ...value,
        revision: value.revision + 1,
        attempt: { ...value.attempt, sequence, exposures: classified.value },
      };
      await request(checkpoints.put(saved));
      return { ok: true, value: saved };
    });
  }

  /** Finalizes once, atomically deleting the matching checkpoint. Identical retries succeed. */
  finalize(
    value: Finalized<Payload, Result>,
  ): Promise<AssessmentResult<Finalized<Payload, Result>>> {
    return this.#transaction('readwrite', async (tx) => {
      value = structuredClone(value);
      if (!isFinalized(value, this.#isPayload, this.#isResult))
        return { ok: false, error: 'invalid-data' };
      const attempts = tx.objectStore('attempts'),
        checkpoints = tx.objectStore('checkpoints');
      const existing: unknown = await request(attempts.get(value.attempt.id));
      if (existing !== undefined && !isFinalized(existing, this.#isPayload, this.#isResult))
        return { ok: false, error: 'invalid-data' };
      const classified = await this.#classify(tx, value.attempt.id, value.attempt.exposures);
      if (!classified.ok) return classified;
      const canonical = { ...value, attempt: { ...value.attempt, exposures: classified.value } };
      if (existing !== undefined) {
        return evidenceJson({ ...canonical, revision: existing.revision }) ===
          evidenceJson(existing)
          ? { ok: true, value: existing }
          : { ok: false, error: 'conflict' };
      }
      const before: unknown = await request(checkpoints.get(value.attempt.id));
      if (
        !isCheckpoint(before, this.#isPayload) ||
        before.revision < 1 ||
        before.attempt.sequence < 1
      )
        return { ok: false, error: before === undefined ? 'conflict' : 'invalid-data' };
      if (value.revision !== before.revision || !canAdvance(before, canonical))
        return { ok: false, error: 'conflict' };
      if (!Number.isSafeInteger(value.revision + 1)) return { ok: false, error: 'invalid-data' };
      const saved = { ...canonical, revision: value.revision + 1 };
      await request(attempts.add(saved));
      await request(checkpoints.delete(value.attempt.id));
      return { ok: true, value: saved };
    });
  }

  /** Reads one validated immutable outcome. */
  loadAttempt(id: string): Promise<AssessmentResult<Finalized<Payload, Result> | null>> {
    return this.#transaction('readonly', async (tx) => {
      const value: unknown = await request(tx.objectStore('attempts').get(id));
      if (value === undefined) return { ok: true, value: null };
      return isFinalized(value, this.#isPayload, this.#isResult)
        ? { ok: true, value }
        : { ok: false, error: 'invalid-data' };
    });
  }

  /** Copies every recording store in one read-only transaction; invalid data yields no partial copy. */
  snapshot(): Promise<AssessmentResult<AssessmentSnapshot<Payload, Result>>> {
    return this.#transaction('readonly', async (tx) => {
      const [records, checkpoints, exposures, sequence]: [
        unknown[],
        unknown[],
        unknown[],
        unknown,
      ] = await Promise.all([
        request(tx.objectStore('attempts').index('sequence').getAll()),
        request(tx.objectStore('checkpoints').index('sequence').getAll()),
        request(tx.objectStore('exposures').getAll()),
        request(tx.objectStore('meta').get('sequence')),
      ]);
      if (
        !records.every((record) => isFinalized(record, this.#isPayload, this.#isResult)) ||
        !checkpoints.every(
          (record): record is Checkpoint<Payload> =>
            isCheckpoint(record, this.#isPayload) &&
            record.revision > 0 &&
            record.attempt.sequence > 0,
        ) ||
        !exposures.every(isStoredExposure) ||
        !isCount(sequence) ||
        [...records, ...checkpoints].some((record) => record.attempt.sequence > sequence)
      )
        return { ok: false, error: 'invalid-data' };
      return { ok: true, value: { version: VERSION, records, checkpoints, exposures, sequence } };
    });
  }

  /** A bounded sequence-ordered history page, after the last sequence already read. */
  history(afterSequence = 0): Promise<AssessmentResult<Finalized<Payload, Result>[]>> {
    return this.#transaction('readonly', async (tx) => {
      if (!Number.isSafeInteger(afterSequence) || afterSequence < 0)
        return { ok: false, error: 'invalid-data' };
      const values: unknown[] = await request(
        tx
          .objectStore('attempts')
          .index('sequence')
          .getAll(IDBKeyRange.lowerBound(afterSequence, true), HISTORY_PAGE),
      );
      return values.every((value) => isFinalized(value, this.#isPayload, this.#isResult))
        ? { ok: true, value: values }
        : { ok: false, error: 'invalid-data' };
    });
  }
}

/**
 * Opens only the supported schema. Blocked opens fail promptly; a late connection is
 * closed. The factory is injectable so blocked browser-property access can be tested.
 */
export async function openAssessment<Payload, Result>(
  isPayload: (value: unknown) => value is Payload,
  isResult: (value: unknown) => value is Result,
  options: { name?: string; factory?: () => IDBFactory } = {},
): Promise<AssessmentResult<AssessmentStore<Payload, Result>>> {
  try {
    const operation = (options.factory?.() ?? indexedDB).open(options.name ?? NAME, VERSION);
    return await new Promise((resolve) => {
      let blocked = false;
      let unsupported = false;
      operation.onblocked = () => {
        blocked = true;
        resolve({ ok: false, error: 'blocked' });
      };
      operation.onupgradeneeded = (event) => {
        if (event.oldVersion !== 0) {
          unsupported = true;
          operation.transaction?.abort();
          return;
        }
        if (blocked) {
          operation.transaction?.abort();
          return;
        }
        const db = operation.result;
        db.createObjectStore('checkpoints', { keyPath: 'attempt.id' }).createIndex(
          'sequence',
          'attempt.sequence',
          { unique: true },
        );
        db.createObjectStore('attempts', { keyPath: 'attempt.id' }).createIndex(
          'sequence',
          'attempt.sequence',
          {
            unique: true,
          },
        );
        db.createObjectStore('exposures', { keyPath: 'encounterId' }).createIndex('key', 'key');
        const meta = db.createObjectStore('meta');
        meta.put({ version: VERSION }, 'schema');
        meta.put(0, 'sequence');
      };
      operation.onerror = () =>
        resolve({
          ok: false,
          error:
            unsupported || operation.error?.name === 'VersionError'
              ? 'unsupported-version'
              : 'unavailable',
        });
      operation.onsuccess = () => {
        const db = operation.result;
        if (blocked) {
          db.close();
          return;
        }
        if (!validSchema(db)) {
          db.close();
          resolve({ ok: false, error: 'invalid-data' });
          return;
        }
        resolve({ ok: true, value: new AssessmentStore(db, isPayload, isResult) });
      };
    });
  } catch {
    return { ok: false, error: 'unavailable' };
  }
}
