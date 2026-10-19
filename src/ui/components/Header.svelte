<!--
@component
The top bar: the level number and the score, which counts up when points are won.

- `level`: level number as shown to the player.
- `score`: total points.
- `onreport()`: the player wants to report a problem with the level.
-->
<script lang="ts">
  import { cubicOut } from 'svelte/easing';
  import { Tween } from 'svelte/motion';
  import { strings } from '../../i18n';
  import { SCORE_COUNT_DURATION } from '../lib/motion';

  type Props = { level: number; score: number; onreport: () => void };
  let { level, score, onreport }: Props = $props();

  // Follows `score`, moving smoothly from the old value to the new one.
  const shown = Tween.of(() => score, { duration: SCORE_COUNT_DURATION, easing: cubicOut });
</script>

<header>
  <div class="level">
    <span>{strings.level(level)}</span>
    <button class="report" aria-label={strings.report} onclick={onreport}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 21V4m0 0h11l-2 4 2 4H5" />
      </svg>
    </button>
  </div>
  <span class="score" aria-label={strings.score}>
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9z" />
    </svg>
    {Math.round(shown.current)}
  </span>
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
    display: flex;
    align-items: center;
    gap: var(--space-1);
  }

  .report {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: none;
    color: var(--color-text-muted);
    cursor: pointer;
  }

  .report svg {
    width: 18px;
    height: 18px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .score {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    font-variant-numeric: tabular-nums;
  }

  svg {
    width: 1.1em;
    height: 1.1em;
    fill: var(--color-bonus);
  }
</style>
