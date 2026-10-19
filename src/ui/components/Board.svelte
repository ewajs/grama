<!--
@component
The board: one row of tiles per target word. Empty rows are the player's hint ("two
words of 3 letters…"); found words pop in, letter by letter.

- `rows`: from `boardRows` in `core/board`.
- `glow`: a found word to briefly highlight (the player spelled it again).
-->
<script lang="ts">
  import { backOut } from 'svelte/easing';
  import { scale } from 'svelte/transition';
  import type { BoardRow } from '../../core/board';
  import { DURATION, TILE_STAGGER } from '../lib/motion';

  let { rows, glow = null }: { rows: readonly BoardRow[]; glow?: string | null } = $props();

  const longest = $derived(Math.max(...rows.map((row) => row.length)));
</script>

<section class="board" style:--cols={longest} style:--rows={rows.length}>
  {#each rows as row, index (index)}
    <div class="row" class:glow={row.word !== null && row.word === glow}>
      {#each { length: row.length }, position}
        {@const letter = row.word?.[position]}
        <div class="tile">
          {#if letter}
            <span
              in:scale={{
                start: 0.4,
                duration: DURATION.slow,
                delay: position * TILE_STAGGER,
                easing: backOut,
              }}
            >
              {letter}
            </span>
          {/if}
        </div>
      {/each}
    </div>
  {/each}
</section>

<style>
  .board {
    --gap: 6px;
    /* Largest tile that fits both the longest row and all the rows, capped. */
    --tile: min(
      52px,
      (100cqw - (var(--cols) - 1) * var(--gap)) / var(--cols),
      (100cqh - (var(--rows) - 1) * var(--gap)) / var(--rows)
    );
    display: flex;
    flex-direction: column;
    height: 100%;
    justify-content: center;
    align-items: center;
    gap: var(--gap);
  }

  .row {
    display: flex;
    gap: var(--gap);
    border-radius: var(--radius-sm);
  }

  .tile {
    position: relative;
    width: var(--tile);
    height: var(--tile);
    border: 1px solid var(--color-tile-border);
    border-radius: var(--radius-sm);
    background: var(--color-tile);
  }

  span {
    position: absolute;
    inset: -1px;
    display: grid;
    place-items: center;
    border-radius: inherit;
    background: var(--color-accent);
    color: var(--color-accent-contrast);
    font-size: calc(var(--tile) * 0.55);
    font-weight: var(--weight-bold);
  }

  .glow {
    animation: glow var(--dur-slow) var(--ease-in-out) 2 alternate;
  }

  @keyframes glow {
    to {
      scale: 1.06;
      filter: brightness(1.25);
    }
  }
</style>
