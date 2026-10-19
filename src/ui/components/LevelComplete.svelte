<!--
@component
Celebrates a finished level over the game screen, with what was won, and moves on.

- `level`: number of the level just finished.
- `points`: points won on it.
- `bonus`: bonus words found on it.
- `onnext()`: the player wants the next level.
-->
<script lang="ts">
  import { backOut } from 'svelte/easing';
  import { fade, scale } from 'svelte/transition';
  import { strings } from '../../i18n';
  import { CELEBRATION_DELAY, DURATION } from '../lib/motion';

  type Props = { level: number; points: number; bonus: number; onnext: () => void };
  let { level, points, bonus, onnext }: Props = $props();
</script>

<div
  class="backdrop"
  role="dialog"
  aria-modal="true"
  aria-labelledby="level-complete-title"
  transition:fade={{ duration: DURATION.base, delay: CELEBRATION_DELAY }}
>
  <div
    class="card"
    in:scale={{
      start: 0.8,
      duration: DURATION.slow,
      delay: CELEBRATION_DELAY,
      easing: backOut,
    }}
  >
    <h2 id="level-complete-title">{strings.levelComplete}</h2>
    <p>{strings.levelCompleteDetail(level)}</p>
    <ul>
      <li class="points">{strings.pointsWon(points)}</li>
      <li class="bonus">{strings.bonusWords(bonus)}</li>
    </ul>
    <button onclick={onnext}>{strings.nextLevel}</button>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    display: grid;
    place-items: center;
    padding: var(--space-6);
    background: rgb(0 0 0 / 0.35);
    backdrop-filter: blur(4px);
  }

  .card {
    display: grid;
    gap: var(--space-3);
    width: min(100%, 340px);
    padding: var(--space-8) var(--space-6) var(--space-6);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    box-shadow: var(--shadow-md);
    text-align: center;
  }

  h2 {
    margin: 0;
    font-size: var(--text-2xl);
    color: var(--color-accent);
  }

  p {
    margin: 0;
    color: var(--color-text-muted);
  }

  ul {
    display: flex;
    justify-content: center;
    gap: var(--space-2);
    margin: var(--space-2) 0 var(--space-4);
    padding: 0;
    list-style: none;
    font-weight: var(--weight-medium);
  }

  li {
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-full);
    background: var(--color-tile);
    box-shadow: inset 0 0 0 1px var(--color-tile-border);
  }

  .points {
    color: var(--color-success);
  }

  .bonus {
    color: var(--color-bonus);
  }

  button {
    min-height: 48px;
    border: none;
    border-radius: var(--radius-full);
    background: var(--color-accent);
    color: var(--color-accent-contrast);
    font: inherit;
    font-size: var(--text-lg);
    font-weight: var(--weight-bold);
    cursor: pointer;
    transition: scale var(--dur-fast) var(--ease-out);
  }

  button:active {
    scale: 0.96;
  }
</style>
