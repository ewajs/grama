/**
 * Letters flying from the word pill into the board.
 * @module
 */

import { backOut, cubicOut } from 'svelte/easing';
import { prefersReducedMotion } from 'svelte/motion';
import { crossfade, scale } from 'svelte/transition';
import { DURATION } from './motion';

/** How long a letter takes to fly from the word pill to its tile. */
export const FLIGHT_DURATION = 380;

/**
 * Letters flying from the word pill into their tiles on the board, as a pair of
 * transitions keyed by the letter's position in the word: the pill's letters `send` as
 * they leave, the board's new tiles `receive` as they arrive, and Svelte animates each
 * letter between the two places. A letter with no partner (a hint's, or a word that isn't
 * a target) pops in, or just goes. A `delay` staggers letters into a cascade.
 */
const [send, receive] = crossfade({
  duration: () => (prefersReducedMotion.current ? 0 : FLIGHT_DURATION),
  easing: cubicOut,
  // Without a partner, an arriving tile pops in; a leaving pill letter just goes, so the
  // feedback pill for a word that wasn't a target shows alone.
  fallback: (node, { delay = 0 }, arriving) =>
    arriving
      ? scale(node, {
          start: 0.4,
          duration: prefersReducedMotion.current ? 0 : DURATION.slow,
          delay,
          easing: backOut,
        })
      : { duration: 0 },
});

/** The pill's half of a letter's flight: `out:sendLetter|global={{ key: index }}`. */
export const sendLetter = send;

/** The board's half of a letter's flight: `in:receiveLetter={{ key: position, delay }}`. */
export const receiveLetter = receive;
