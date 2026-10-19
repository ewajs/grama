/**
 * Saving and loading Tu diccionario, apart from the progress (D24): a new save version
 * for the main game never wipes it, and starting over keeps it.
 * @module
 */

import { NEW_DICTIONARY, type Dictionary } from '../core/dictionary';

const KEY = 'grama.words';

/**
 * The saved dictionary, or an empty one when there is none or it can't be read.
 * @param storage Where it lives; `localStorage` unless a test passes another.
 */
export function loadDictionary(storage: Pick<Storage, 'getItem'> = localStorage): Dictionary {
  try {
    const saved: unknown = JSON.parse(storage.getItem(KEY) ?? 'null');
    return Array.isArray(saved) && saved.every((word) => typeof word === 'string')
      ? saved
      : NEW_DICTIONARY;
  } catch {
    return NEW_DICTIONARY;
  }
}

/**
 * Saves the dictionary. If storage is full or blocked, it lasts until the page closes.
 * @param storage Where it lives; `localStorage` unless a test passes another.
 */
export function saveDictionary(
  dictionary: Dictionary,
  storage: Pick<Storage, 'setItem'> = localStorage,
) {
  try {
    storage.setItem(KEY, JSON.stringify(dictionary));
  } catch {
    // Not worth interrupting the player over.
  }
}
