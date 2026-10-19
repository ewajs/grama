<!--
@component
The board: one row of tiles per target word. Empty rows are the player's hint ("two
words of 3 letters…"); found words pop in, letter by letter. It fills the space it's
given, choosing one or two columns to keep tiles as big as possible.

- `rows`: from `boardRows` in `core/board`.
- `glow`: a found word to briefly highlight (the player spelled it again).
-->
<script lang="ts">
  import { backOut } from 'svelte/easing';
  import { scale } from 'svelte/transition';
  import type { BoardRow } from '../../core/board';
  import { boardLayout, COLUMN_GAP, splitIntoColumns, TILE_GAP } from '../lib/board-layout';
  import { DURATION, TILE_STAGGER } from '../lib/motion';

  let { rows, glow = null }: { rows: readonly BoardRow[]; glow?: string | null } = $props();

  // Svelte keeps these in sync with the element's size (bind:clientWidth/Height below).
  let width = $state(0);
  let height = $state(0);

  const layout = $derived(
    boardLayout(
      rows.map((row) => row.length),
      width,
      height,
    ),
  );
  const columns = $derived(splitIntoColumns(rows, layout.columns));
</script>

<section
  class="board"
  bind:clientWidth={width}
  bind:clientHeight={height}
  style:--tile="{layout.tile}px"
  style:--gap="{TILE_GAP}px"
  style:--column-gap="{COLUMN_GAP}px"
>
  {#each columns as column, c (c)}
    <div class="column">
      {#each column as row, index (index)}
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
    </div>
  {/each}
</section>

<style>
  .board {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: var(--column-gap);
    height: 100%;
  }

  .column {
    display: flex;
    flex-direction: column;
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
    /* Proportional, so small tiles stay squares with rounded corners, not circles. */
    border-radius: calc(var(--tile) * 0.18);
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
