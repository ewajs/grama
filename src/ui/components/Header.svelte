<!--
@component
The top bar: the level number and the score, which counts up when points are won.

- `level`: level number as shown to the player.
- `tier`: how hard the level is, shown as a badge under the level number.
- `score`: total points.
- `onmenu()`: the player wants the menu.
-->
<script lang="ts">
  import { cubicOut } from 'svelte/easing';
  import { Tween } from 'svelte/motion';
  import type { Tier } from '../../core/difficulty';
  import { strings } from '../../i18n';
  import { SCORE_COUNT_DURATION } from '../lib/motion';

  type Props = { level: number; tier: Tier; score: number; onmenu: () => void };
  let { level, tier, score, onmenu }: Props = $props();

  // Follows `score`, moving smoothly from the old value to the new one.
  const shown = Tween.of(() => score, { duration: SCORE_COUNT_DURATION, easing: cubicOut });
</script>

<header>
  <div class="level">
    <span class="title">{strings.level(level)}</span>
    <span class="badge {tier}">{strings.tiers[tier]}</span>
  </div>
  <div class="end">
    <span class="score" aria-label={strings.score}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9z" />
      </svg>
      {Math.round(shown.current)}
    </span>
    <button class="menu" aria-label={strings.openMenu} onclick={onmenu}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 7h16M4 12h16M4 17h16" />
      </svg>
    </button>
  </div>
</header>

<style>
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    align-self: stretch;
    font-size: var(--text-lg);
    font-weight: var(--weight-medium);
  }

  .level {
    display: grid;
    justify-items: start;
    gap: 2px;
  }

  .title {
    line-height: 1.1;
  }

  /* Compact, so the board keeps its room. */
  .badge {
    padding: 0 var(--space-2);
    border-radius: var(--radius-full);
    color: var(--color-accent-contrast);
    font-size: 11px;
    font-weight: var(--weight-bold);
    letter-spacing: 0.04em;
    line-height: 16px;
    text-transform: uppercase;
  }

  .easy {
    background: var(--color-success);
  }

  .medium {
    background: var(--color-accent);
  }

  .hard {
    background: var(--color-bonus);
  }

  .extra {
    background: var(--color-danger);
  }

  .end {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .menu {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    margin-right: calc(-1 * var(--space-2));
    padding: 0;
    border: none;
    border-radius: 50%;
    background: none;
    color: var(--color-text);
    cursor: pointer;
  }

  .menu svg {
    width: 22px;
    height: 22px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
  }

  .score {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    font-variant-numeric: tabular-nums;
  }

  .score svg {
    width: 1.1em;
    height: 1.1em;
    fill: var(--color-bonus);
  }
</style>
