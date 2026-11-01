import type { Page } from '@playwright/test';
import type { Checkpoint, Finalized } from '../../src/storage/assessment-record';

/** Reads raw browser records so end-to-end checks observe actual durable writes. */
export async function assessmentRecords<Payload, Result>(
  page: Page,
): Promise<{ checkpoints: Checkpoint<Payload>[]; attempts: Finalized<Payload, Result>[] }> {
  return page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const open = indexedDB.open('grama.assessment');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result,
            tx = db.transaction(['checkpoints', 'attempts']);
          const checkpoints = tx.objectStore('checkpoints').getAll(),
            attempts = tx.objectStore('attempts').getAll();
          tx.oncomplete = () => {
            db.close();
            resolve({ checkpoints: checkpoints.result, attempts: attempts.result });
          };
          tx.onabort = () => {
            db.close();
            reject(tx.error);
          };
        };
      }),
  );
}
