import type { Level } from './level';
import type { Session } from './session';

/** Hints a new game starts with. */
export const STARTING_HINTS = 3;

/** Bonus words to find for each hint earned. */
export const BONUS_WORDS_PER_HINT = 5;

/** Hints earned for completing an extra-hard level. */
export const EXTRA_HARD_HINTS = 1;

/**
 * The target a hint would reveal a letter of, or `null` when no target can take one.
 * Of the targets not found yet, the one showing the fewest letters (the shortest on a
 * tie), so hints spread over the board. A hint never reveals a word's last letter: the
 * player still has to spell it.
 */
export function hintTarget(level: Level, { found, revealed }: Session): string | null {
  const shown = (word: string) => revealed[word] ?? 0;
  const candidates = level.targets.filter(
    (word) => !found.includes(word) && shown(word) < word.length - 1,
  );
  // Stable sort: equal targets keep the level's order.
  candidates.sort((a, b) => shown(a) - shown(b) || a.length - b.length);
  return candidates[0] ?? null;
}

/**
 * Reveals the next letter of a target (see {@link hintTarget}). Spending the hint is up
 * to the caller (`useHint` in `core/progress`).
 * @returns The new session, or the same one when nothing can be revealed.
 */
export function revealLetter(session: Session, level: Level): Session {
  const word = hintTarget(level, session);
  if (word === null) return session;
  return {
    ...session,
    revealed: { ...session.revealed, [word]: (session.revealed[word] ?? 0) + 1 },
  };
}
