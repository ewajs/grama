import { TIERS } from '../../core/difficulty';
import type { Level } from '../../core/level';
import { levelProblems } from '../../core/level';
import type { Place } from '../../core/progress';
import type { Session } from '../../core/session';
import { evidenceJson } from '../../storage/assessment-record';
import { isObject, isCount, isDifficulty, isDate } from '../../storage/guards';
import { describePuzzle, type PuzzleDescriptor, type GramaResult } from './grama';

/** The current game state copied at a semantic interaction, never a Svelte proxy. */
export type PuzzleObservation = {
  place: Place;
  level: Level;
  session: Session;
  replay: boolean;
  playedBefore: boolean;
  complete: boolean;
};

/** A versioned puzzle snapshot, including the original difficulty features and assistance. */
export type PuzzlePayload = {
  version: 1;
  place: Place;
  level: Level;
  descriptor: PuzzleDescriptor;
  session: Session;
  replay: boolean;
  /** False until the UI acknowledges observation after the initial durable exposure write. */
  presented: boolean;
};

/** The puzzle branch of the shared Grama result, without game reward multipliers. */
export type PuzzleResult = Extract<GramaResult, { kind: 'puzzle' }>;

const word = (v: unknown): v is string => typeof v === 'string' && /^[A-ZÑ]{3,}$/.test(v);
const words = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every(word) && new Set(v).size === v.length;
const revealed = (v: unknown): v is Session['revealed'] =>
  isObject(v) && Object.entries(v).every(([key, n]) => word(key) && isCount(n) && n < key.length);

/** A place's stable identity; puzzle content and exposure have identities of their own. */
export function placeKey(place: Place): string {
  return place.kind === 'daily'
    ? `daily:${place.date}`
    : `level:${place.levelNumber}:${place.difficulty}:${place.occurrence}`;
}

function isPlace(v: unknown): v is Place {
  if (!isObject(v)) return false;
  if (v.kind === 'level')
    return (
      isCount(v.levelNumber) &&
      v.levelNumber > 0 &&
      isCount(v.occurrence) &&
      isDifficulty(v.difficulty)
    );
  return v.kind === 'daily' && isDate(v.date);
}

/** Validates an original puzzle outcome independently from the mutable game save. */
export function isPuzzleResult(v: unknown): v is PuzzleResult {
  return isObject(v) && v.kind === 'puzzle' && words(v.found) && revealed(v.revealed);
}

/** Validates the game snapshot and reproduces its descriptor from stored ranks, not new data. */
export function isPuzzlePayload(v: unknown): v is PuzzlePayload {
  if (
    !isObject(v) ||
    v.version !== 1 ||
    !isPlace(v.place) ||
    typeof v.replay !== 'boolean' ||
    typeof v.presented !== 'boolean' ||
    !isObject(v.level) ||
    !isObject(v.session) ||
    !isObject(v.descriptor)
  )
    return false;
  const { level, session, descriptor } = v;
  if (
    !Array.isArray(level.letters) ||
    !level.letters.every((l) => typeof l === 'string' && /^[A-ZÑ]$/.test(l)) ||
    !words(level.targets) ||
    !words(level.bonus) ||
    !TIERS.some((tier) => tier === level.tier) ||
    !words(session.found) ||
    !revealed(session.revealed) ||
    !isCount(session.points) ||
    !isCount(session.hintsWon) ||
    !Array.isArray(descriptor.targets)
  )
    return false;
  const checkedLevel = level as Level;
  if (
    levelProblems(checkedLevel).length ||
    !session.found.every((w) => [...checkedLevel.targets, ...checkedLevel.bonus].includes(w)) ||
    !Object.keys(session.revealed).every((w) => checkedLevel.targets.includes(w))
  )
    return false;
  const ranks = new Map<string, number>();
  for (const target of descriptor.targets) {
    if (!isObject(target) || !word(target.word) || (target.rank !== null && !isCount(target.rank)))
      return false;
    if (target.rank !== null) ranks.set(target.word, target.rank);
  }
  return evidenceJson(describePuzzle(checkedLevel, ranks)) === evidenceJson(descriptor);
}

/** Whether a game save has progressed beyond a checkpoint, rather than restarting it. */
export function extendsSession(before: Session, after: Session): boolean {
  return (
    before.found.every((w) => after.found.includes(w)) &&
    Object.entries(before.revealed).every(([w, n]) => (after.revealed[w] ?? 0) >= n) &&
    after.points >= before.points
  );
}
