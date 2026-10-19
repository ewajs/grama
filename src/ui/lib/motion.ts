/**
 * Durations in milliseconds for animations driven from script (Svelte transitions,
 * tweens). They mirror the `--dur-*` tokens in `styles/tokens.css`; keep both in sync.
 */
export const DURATION = { fast: 120, base: 180, slow: 250 } as const;

/** How long the result of a submitted word stays on screen. */
export const FEEDBACK_DURATION = 600;

/** Delay between consecutive tiles of a word appearing, for a quick cascade. */
export const TILE_STAGGER = 45;
