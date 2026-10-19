/**
 * Saving and loading the player's Contrarreloj record, apart from their progress: a new
 * save version for the main game never wipes it, and it never touches the main game.
 * @module
 */

import { NEW_TRIAL_RECORD, type RunResult, type TrialRecord } from '../core/time-trial';

const KEY = 'grama.trials';

/**
 * The saved record, or a new one when there is none or it can't be read.
 * @param storage Where it lives; `localStorage` unless a test passes another.
 */
export function loadTrials(storage: Pick<Storage, 'getItem'> = localStorage): TrialRecord {
  try {
    const saved: unknown = JSON.parse(storage.getItem(KEY) ?? 'null');
    return isRecord(saved) ? saved : NEW_TRIAL_RECORD;
  } catch {
    return NEW_TRIAL_RECORD;
  }
}

/**
 * Saves the record. If storage is full or blocked, it lasts until the page closes.
 * @param storage Where it lives; `localStorage` unless a test passes another.
 */
export function saveTrials(record: TrialRecord, storage: Pick<Storage, 'setItem'> = localStorage) {
  try {
    storage.setItem(KEY, JSON.stringify(record));
  } catch {
    // Not worth interrupting the player over.
  }
}

function isRecord(value: unknown): value is TrialRecord {
  if (typeof value !== 'object' || value === null) return false;
  const { runs, best, mostCleared } = value as Partial<TrialRecord>;
  return (
    Number.isInteger(runs) && Number.isInteger(mostCleared) && (best === null || isResult(best))
  );
}

function isResult(value: unknown): value is RunResult {
  if (typeof value !== 'object' || value === null) return false;
  const { points, cleared, words } = value as Partial<RunResult>;
  return [points, cleared, words].every(Number.isInteger);
}
