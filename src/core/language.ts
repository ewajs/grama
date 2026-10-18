/** The word rules of a language pack: how words are compared in that language. */
export type Language = {
  /** ISO 639-1 code, e.g. `'es'`. */
  code: string;
  /**
   * Brings a word to the form used for comparison and display on the board.
   * Two spellings the player should see as the same word must normalize equally.
   */
  normalize: (word: string) => string;
};
