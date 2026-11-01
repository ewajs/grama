import { exposureFor, type Exposure } from '../core/assessment/attempt';
import { isCheckpoint, isExposure, type Checkpoint } from './assessment-record';

/** Explicit outcomes let the app continue play when assessment storage cannot be used. */
export type AssessmentResult<Value> =
  | { ok: true; value: Value }
  | {
      ok: false;
      error:
        'unavailable' | 'blocked' | 'unsupported-version' | 'invalid-data' | 'conflict' | 'failed';
    };

const NAME = 'grama.assessment';
const VERSION = 1;
const STORES = ['checkpoints', 'attempts', 'exposures', 'meta'];

function validSchema(db: IDBDatabase): boolean {
  if (!STORES.every((name) => db.objectStoreNames.contains(name))) return false;
  try {
    const tx = db.transaction(STORES);
    const exposures = tx.objectStore('exposures');
    const attempts = tx.objectStore('attempts');
    return (
      tx.objectStore('checkpoints').keyPath === 'attempt.id' &&
      attempts.keyPath === 'id' &&
      attempts.index('sequence').keyPath === 'sequence' &&
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

/** Versioned local assessment database; no game is wired to it yet. */
export class AssessmentStore<Payload> {
  #db: IDBDatabase;
  #isPayload: (value: unknown) => value is Payload;

  /** Created by openAssessment after schema checks. */
  constructor(db: IDBDatabase, isPayload: (value: unknown) => value is Payload) {
    this.#db = db;
    this.#isPayload = isPayload;
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
    try {
      tx = this.#db.transaction(STORES, mode);
      const done = new Promise<boolean>((resolve) => {
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
      return { ok: false, error: 'failed' };
    }
  }

  /** Reads a validated unfinished attempt. Unknown record versions are never treated as fresh. */
  loadCheckpoint(id: string): Promise<AssessmentResult<Checkpoint<Payload> | null>> {
    return this.#transaction('readonly', async (tx) => {
      const value: unknown = await request(tx.objectStore('checkpoints').get(id));
      if (value === undefined) return { ok: true, value: null };
      return isCheckpoint(value, this.#isPayload)
        ? { ok: true, value }
        : { ok: false, error: 'invalid-data' };
    });
  }

  /** Looks up all known encounters of content, across modes and app visits. */
  exposures(key: string): Promise<AssessmentResult<Exposure[]>> {
    return this.#transaction('readonly', async (tx) => {
      const values: unknown[] = await request(tx.objectStore('exposures').index('key').getAll(key));
      return values.every(isExposure)
        ? { ok: true, value: values }
        : { ok: false, error: 'invalid-data' };
    });
  }

  /**
   * Commits the checkpoint and its exposure ledger together. Returns the canonical
   * classification: a concurrent encounter of the same content becomes a repeat.
   * Revisions/finalization are the next cycle; do not wire competing checkpoint writers yet.
   */
  saveCheckpoint(value: Checkpoint<Payload>): Promise<AssessmentResult<Checkpoint<Payload>>> {
    return this.#transaction('readwrite', async (tx) => {
      value = structuredClone(value);
      if (!isCheckpoint(value, this.#isPayload)) return { ok: false, error: 'invalid-data' };
      const ledger = tx.objectStore('exposures');
      const exposures: Exposure[] = [];
      for (const proposed of value.attempt.exposures) {
        const existing: unknown = await request(ledger.get(proposed.encounterId));
        if (existing !== undefined) {
          if (!isExposure(existing)) return { ok: false, error: 'invalid-data' };
          if (existing.key !== proposed.key) return { ok: false, error: 'conflict' };
        }
        const known: unknown[] = await request(ledger.index('key').getAll(proposed.key));
        if (!known.every(isExposure)) return { ok: false, error: 'invalid-data' };
        const classified =
          existing === undefined && proposed.kind === 'repeat'
            ? proposed
            : exposureFor(
                proposed.key,
                proposed.encounterId,
                known,
                proposed.kind === 'unknown' ? 'partial' : 'complete',
              );
        exposures.push(classified);
        await request(ledger.put(classified));
      }
      const saved = { ...value, attempt: { ...value.attempt, exposures } };
      await request(tx.objectStore('checkpoints').put(saved));
      return { ok: true, value: saved };
    });
  }
}

/**
 * Opens only the supported schema. Blocked opens fail promptly; a late connection is
 * closed. The factory is injectable so blocked browser-property access can be tested.
 */
export async function openAssessment<Payload>(
  isPayload: (value: unknown) => value is Payload,
  options: { name?: string; factory?: () => IDBFactory } = {},
): Promise<AssessmentResult<AssessmentStore<Payload>>> {
  try {
    const operation = (options.factory?.() ?? indexedDB).open(options.name ?? NAME, VERSION);
    return await new Promise((resolve) => {
      let blocked = false;
      operation.onblocked = () => {
        blocked = true;
        resolve({ ok: false, error: 'blocked' });
      };
      operation.onupgradeneeded = () => {
        if (blocked) {
          operation.transaction?.abort();
          return;
        }
        const db = operation.result;
        db.createObjectStore('checkpoints', { keyPath: 'attempt.id' });
        db.createObjectStore('attempts', { keyPath: 'id' }).createIndex('sequence', 'sequence', {
          unique: true,
        });
        db.createObjectStore('exposures', { keyPath: 'encounterId' }).createIndex('key', 'key');
        db.createObjectStore('meta').put({ version: VERSION }, 'schema');
      };
      operation.onerror = () =>
        resolve({
          ok: false,
          error: operation.error?.name === 'VersionError' ? 'unsupported-version' : 'unavailable',
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
        resolve({ ok: true, value: new AssessmentStore(db, isPayload) });
      };
    });
  } catch {
    return { ok: false, error: 'unavailable' };
  }
}
