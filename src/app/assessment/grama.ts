import type { Level } from '../../core/level';
import type { Session } from '../../core/session';
import type { RunResult } from '../../core/time-trial';

/** Grama evidence payloads; game rewards are observations, never a skill formula. */
export type GramaResult =
  | { kind: 'puzzle'; found: Session['found']; revealed: Session['revealed'] }
  | { kind: 'trial'; run: RunResult; skipped: number };

/**
 * Content identity independent of mode, level number, shuffle and generator version.
 * Exposure uses the whole wheel: remembering its words helps even if targets change.
 * Inputs are normalized, as required by Level; JSON encoding avoids delimiter collisions.
 */
export function puzzleIdentity(level: Pick<Level, 'letters' | 'targets'>): {
  challengeId: string;
  exposureKey: string;
} {
  const letters = level.letters.toSorted();
  return {
    challengeId: JSON.stringify(['grama:es:puzzle:1', letters, level.targets.toSorted()]),
    exposureKey: JSON.stringify(['grama:es:wheel:1', letters]),
  };
}
