import type { Level } from '../../core/level';
import type { Session } from '../../core/session';
import type { RunResult } from '../../core/time-trial';
import { levelScore, type Tier } from '../../core/difficulty';

/** Versioned raw difficulty features; a missing rank leaves the aggregate score unknown. */
export type PuzzleDescriptor = {
  version: 1;
  challengeId: string;
  exposureKey: string;
  wheelSize: number;
  targetCount: number;
  tier: Tier;
  score: number | null;
  targets: readonly { word: string; length: number; rank: number | null }[];
};

/**
 * Describes a puzzle using the existing levelScore formula. The app builds ranks once
 * from the loaded word order (zero-based) and supplies them; no default rank is invented.
 * Descriptor version and Attempt.contentVersion jointly identify the feature definition
 * and source data. No generator inputs or output are changed.
 */
export function describePuzzle(
  level: Pick<Level, 'letters' | 'targets' | 'tier'>,
  ranks: ReadonlyMap<string, number>,
): PuzzleDescriptor {
  const targets = level.targets.toSorted().map((word) => {
    const rank = ranks.get(word);
    return {
      word,
      length: word.length,
      rank: rank !== undefined && Number.isSafeInteger(rank) && rank >= 0 ? rank : null,
    };
  });
  const ranked = targets.filter(
    (target): target is typeof target & { rank: number } => target.rank !== null,
  );
  return {
    version: 1,
    ...puzzleIdentity(level),
    wheelSize: level.letters.length,
    targetCount: targets.length,
    tier: level.tier,
    score:
      targets.length > 0 && ranked.length === targets.length
        ? levelScore(ranked, level.letters.length)
        : null,
    targets,
  };
}

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
