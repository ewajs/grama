import type { GameState } from './game';
import type { Level } from './level';

/** Hints a new game starts with. */
export const STARTING_HINTS = 3;

/** Bonus words to find for each hint earned. */
export const BONUS_WORDS_PER_HINT = 5;

/** The state after finding a bonus word: a step closer to the next hint, or a hint earned. */
export function countBonusWord(state: GameState): GameState {
  const progress = state.bonusTowardHint + 1;
  return progress < BONUS_WORDS_PER_HINT
    ? { ...state, bonusTowardHint: progress }
    : { ...state, bonusTowardHint: 0, hints: state.hints + 1 };
}

/**
 * The target a hint would reveal a letter of, or `null` when no target can take one.
 * Of the targets not found yet, the one showing the fewest letters (the shortest on a
 * tie), so hints spread over the board. A hint never reveals a word's last letter: the
 * player still has to spell it.
 * @param revealed Letters shown so far for each target.
 */
export function hintTarget(
  level: Level,
  found: readonly string[],
  revealed: Readonly<Record<string, number>>,
): string | null {
  const shown = (word: string) => revealed[word] ?? 0;
  const candidates = level.targets.filter(
    (word) => !found.includes(word) && shown(word) < word.length - 1,
  );
  // Stable sort: equal targets keep the level's order.
  candidates.sort((a, b) => shown(a) - shown(b) || a.length - b.length);
  return candidates[0] ?? null;
}

/**
 * Spends a hint to reveal the next letter of a target (see {@link hintTarget}).
 * @returns The new state, or the same object when there's no hint left or nothing to reveal.
 */
export function revealLetter(state: GameState, level: Level): GameState {
  const word = hintTarget(level, state.found, state.revealed);
  if (state.hints === 0 || word === null) return state;
  return {
    ...state,
    hints: state.hints - 1,
    revealed: { ...state.revealed, [word]: (state.revealed[word] ?? 0) + 1 },
  };
}
