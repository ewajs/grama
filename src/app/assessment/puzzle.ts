import type { Level } from '../../core/level';
import { levelProblems } from '../../core/level';
import type { Place } from '../../core/progress';
import type { Session } from '../../core/session';
import { evidenceJson } from '../../storage/assessment-record';
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

const object = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const count = (v: unknown): v is number =>
  typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;
const word = (v: unknown): v is string => typeof v === 'string' && /^[A-ZÑ]{3,}$/.test(v);
const words = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every(word) && new Set(v).size === v.length;
const revealed = (v: unknown): v is Session['revealed'] =>
  object(v) && Object.entries(v).every(([key, n]) => word(key) && count(n) && n < key.length);
const tier = (v: unknown) => v === 'easy' || v === 'medium' || v === 'hard' || v === 'extra';

/** A place's stable identity; puzzle content and exposure have identities of their own. */
export function placeKey(place: Place): string {
  return place.kind === 'daily'
    ? `daily:${place.date}`
    : `level:${place.levelNumber}:${place.difficulty}:${place.occurrence}`;
}

function isPlace(v: unknown): v is Place {
  if (!object(v)) return false;
  if (v.kind === 'level')
    return (
      count(v.levelNumber) &&
      v.levelNumber > 0 &&
      count(v.occurrence) &&
      (v.difficulty === 'normal' || v.difficulty === 'relaxed' || v.difficulty === 'challenging')
    );
  return (
    v.kind === 'daily' &&
    typeof v.date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(v.date) &&
    Number.isFinite(Date.parse(v.date)) &&
    new Date(v.date).toISOString().slice(0, 10) === v.date
  );
}

/** Validates an original puzzle outcome independently from the mutable game save. */
export function isPuzzleResult(v: unknown): v is PuzzleResult {
  return object(v) && v.kind === 'puzzle' && words(v.found) && revealed(v.revealed);
}

/** Validates the game snapshot and reproduces its descriptor from stored ranks, not new data. */
export function isPuzzlePayload(v: unknown): v is PuzzlePayload {
  if (
    !object(v) ||
    v.version !== 1 ||
    !isPlace(v.place) ||
    typeof v.replay !== 'boolean' ||
    typeof v.presented !== 'boolean' ||
    !object(v.level) ||
    !object(v.session) ||
    !object(v.descriptor)
  )
    return false;
  const { level, session, descriptor } = v;
  if (
    !Array.isArray(level.letters) ||
    !level.letters.every((l) => typeof l === 'string' && /^[A-ZÑ]$/.test(l)) ||
    !words(level.targets) ||
    !words(level.bonus) ||
    !tier(level.tier) ||
    !words(session.found) ||
    !revealed(session.revealed) ||
    !count(session.points) ||
    !count(session.hintsWon) ||
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
    if (!object(target) || !word(target.word) || (target.rank !== null && !count(target.rank)))
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
