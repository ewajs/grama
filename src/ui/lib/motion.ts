/**
 * Durations for animations driven from script, matching the CSS tokens, and the
 * transitions that move things, toned down for players who ask for less motion.
 * @module
 */

import { prefersReducedMotion } from 'svelte/motion';
import {
  fade,
  fly as svelteFly,
  scale as svelteScale,
  type FlyParams,
  type ScaleParams,
  type TransitionConfig,
} from 'svelte/transition';

/**
 * Durations in milliseconds for animations driven from script (Svelte transitions,
 * tweens). They mirror the `--dur-*` tokens in `styles/tokens.css`; keep both in sync.
 */
export const DURATION = { fast: 120, base: 180, slow: 250 } as const;

/** How long the score takes to count up to a new value. */
export const SCORE_COUNT_DURATION = 400;

/** How long the result of a submitted word stays on screen. */
export const FEEDBACK_DURATION = 700;

/** Pause after the last word before celebrating, so its tiles can pop in first. */
export const CELEBRATION_DELAY = 500;

/** Delay between a level's stars landing, one by one. */
export const STAR_STAGGER = 250;

/** Delay between consecutive tiles of a word appearing, for a quick cascade. */
export const TILE_STAGGER = 45;

/**
 * Svelte's `fly`, or a plain fade when the device asks for reduced motion. Use it instead
 * of the one in `svelte/transition`.
 */
export function fly(node: Element, params: FlyParams = {}): TransitionConfig {
  return prefersReducedMotion.current ? fade(node, params) : svelteFly(node, params);
}

/**
 * Svelte's `scale`, or a plain fade when the device asks for reduced motion. Use it
 * instead of the one in `svelte/transition`.
 */
export function scale(node: Element, params: ScaleParams = {}): TransitionConfig {
  return prefersReducedMotion.current ? fade(node, params) : svelteScale(node, params);
}
