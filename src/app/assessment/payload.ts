import { isPuzzlePayload, isPuzzleResult, type PuzzlePayload } from './puzzle';
import { isTrialPayload, isTrialResult, type TrialPayload } from './trial';
import type { GramaResult } from './grama';
import type { Finalized } from '../../storage/assessment-record';

/** Both Grama adapters share the same database and exposure ledger. */
export type GramaPayload = PuzzlePayload | TrialPayload;

/** One original completed or abandoned observation, as returned by the shared history store. */
export type GramaRecord = Finalized<GramaPayload, GramaResult>;

/** Validates either supported observation without discarding existing puzzle records. */
export function isGramaPayload(value: unknown): value is GramaPayload {
  return isPuzzlePayload(value) || isTrialPayload(value);
}

/** Validates the completed result of either Grama track. */
export function isGramaResult(value: unknown): value is GramaResult {
  return isPuzzleResult(value) || isTrialResult(value);
}
