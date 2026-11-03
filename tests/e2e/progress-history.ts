import type { Page } from '@playwright/test';
import { describePuzzle, GRAMA_RULES } from '../../src/app/assessment/grama';
import type { GramaRecord } from '../../src/app/assessment/payload';
import { describeTrial, trialResult } from '../../src/app/assessment/trial';
import { NEW_SESSION } from '../../src/core/session';
import { LEVELS_VERSION } from '../../src/core/generate';
import { level, trialWheel } from './level';

/** Original-shaped puzzle evidence, including missing time, difficulty and a practice result. */
export function puzzleHistory(): GramaRecord[] {
  return Array.from({ length: 8 }, (_, index) => {
    const sequence = index + 1,
      played = level(sequence),
      descriptor = describePuzzle(
        played,
        index === 6 ? new Map() : new Map(played.targets.map((word, i) => [word, 2000 + i * 100])),
      ),
      session = { ...NEW_SESSION, found: [...played.targets, ...played.bonus.slice(0, index % 4)] },
      timing = index === 1 ? ('uncertain' as const) : ('reliable' as const);
    return {
      version: 2,
      revision: 2,
      payload: {
        version: 1,
        place: {
          kind: 'level',
          levelNumber: sequence,
          difficulty: 'normal',
          occurrence: sequence - 1,
        },
        level: played,
        descriptor,
        session,
        replay: index === 7,
        presented: true,
      },
      clock: { state: 'finished', activeMs: 60000, timing },
      attempt: {
        id: `puzzle-${sequence}`,
        sequence,
        game: 'grama',
        track: 'word-solving',
        mode: 'level',
        rulesVersion: GRAMA_RULES.puzzle,
        contentVersion: String(LEVELS_VERSION),
        startedAt: 1793500000000 + sequence * 100000,
        endedAt: 1793500060000 + sequence * 100000,
        activeMs: 60000,
        timing,
        status: 'completed',
        result: { kind: 'puzzle', found: session.found, revealed: session.revealed },
        exposures: [
          {
            key: descriptor.exposureKey,
            encounterId: `wheel-${sequence}`,
            kind: index === 7 ? 'repeat' : 'first',
          },
        ],
      },
    };
  });
}

/** More than one history page of ordinary trial scores, including repeated wheels. */
export function trialHistory(): GramaRecord[] {
  const played = trialWheel(0.5);
  return Array.from({ length: 102 }, (_, index) => {
    const sequence = 100 + index,
      found = index === 101 ? played.targets.slice(0, 1) : [],
      points = found.reduce((sum, word) => sum + word.length * 10, 0),
      payload = describeTrial(
        {
          kind: 'trial',
          seed: Math.floor(0.5 * 2 ** 31),
          timeLeft: 0,
          points,
          cleared: 0,
          words: found.length,
          wheels: [{ level: played, session: { ...NEW_SESSION, found }, outcome: 'current' }],
        },
        new Map(),
      );
    return {
      version: 2,
      revision: 2,
      payload,
      clock: { state: 'finished', activeMs: 60000, timing: 'reliable' },
      attempt: {
        id: `trial-${sequence}`,
        sequence,
        game: 'grama',
        track: 'time-trial',
        mode: 'trial',
        rulesVersion: GRAMA_RULES.trial,
        contentVersion: String(LEVELS_VERSION),
        startedAt: 1793500000000 + sequence * 100000,
        endedAt: 1793500060000 + sequence * 100000,
        activeMs: 60000,
        timing: 'reliable',
        status: 'completed',
        result: trialResult(payload),
        exposures: [
          {
            key: payload.wheels[0]!.descriptor.exposureKey,
            encounterId: `trial-wheel-${sequence}`,
            kind: index === 0 ? 'first' : 'repeat',
          },
        ],
      },
    };
  });
}

/** Seeds the browser's native store after the app has opened it, without adding production hooks. */
export async function installHistory(page: Page, records: GramaRecord[]) {
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
          tx.objectStore('meta').put(
            Math.max(...data.map((record) => record.attempt.sequence)),
            'sequence',
          );
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
    records,
  );
}
