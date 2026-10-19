/**
 * Spelling on the wheel from a keyboard.
 * @module
 */

import { spanish } from '../../core/spanish';

/** What the wheel can do from the keyboard (see `LetterWheel`). */
export type KeyboardWheel = {
  /** Adds a letter (normalized) to the word. */
  type: (letter: string) => void;
  /** Takes back the last letter. */
  erase: () => void;
  /** Submits the word. */
  submit: () => void;
  /** Drops the word. */
  clear: () => void;
};

/**
 * Handles a key press for the wheel: letters spell (accents ignored, `Ñ` included),
 * Enter submits, Backspace erases, Escape clears. With no word started, Enter and the
 * rest are left alone, so they keep doing what they would (press a focused button…).
 * @param spelling Whether a word is being spelled.
 * @returns Whether the key was used, so the caller can `preventDefault()`.
 */
export function wheelKey(event: KeyboardEvent, wheel: KeyboardWheel, spelling: boolean): boolean {
  if (event.ctrlKey || event.metaKey || event.altKey) return false;
  if (spelling && event.key === 'Enter') wheel.submit();
  else if (spelling && event.key === 'Backspace') wheel.erase();
  else if (spelling && event.key === 'Escape') wheel.clear();
  else if (event.key.length === 1 && /^[A-ZÑ]$/.test(spanish.normalize(event.key))) {
    wheel.type(spanish.normalize(event.key));
  } else return false;
  return true;
}
