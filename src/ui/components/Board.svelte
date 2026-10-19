<!--
@component
The board: one row of tiles per target word. Empty rows are the player's hint ("two
words of 3 letters…"); found words' letters fly in from the word pill (`ui/lib/fly`), and letters revealed by
hints show outlined. It fills the space it's given, choosing one or two columns to keep
tiles as big as possible.

- `rows`: from `boardRows` in `core/board`.
- `glow`: a found word to briefly highlight (the player spelled it again).
- `ondefine(word)`: the player tapped a found word, to see what it means.
-->
<script lang="ts">
  import type { BoardRow } from '../../core/board';
  import { boardLayout, COLUMN_GAP, splitIntoColumns, TILE_GAP } from '../lib/board-layout';
  import { strings } from '../../i18n';
  import { receiveLetter } from '../lib/fly';
  import { TILE_STAGGER } from '../lib/motion';

  type Props = {
    rows: readonly BoardRow[];
    glow?: string | null;
    ondefine?: (word: string) => void;
  };
  let { rows, glow = null, ondefine }: Props = $props();

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
      <!-- Keyed by word, so a hinted row keeps its letters when the word is found. -->
      {#each column as row, index (row.word ?? `empty:${row.length}:${index}`)}
        <div class="row" class:glow={row.word !== null && row.word === glow}>
          {#each { length: row.length }, position}
            {@const letter = position < row.shown ? row.word?.[position] : undefined}
            <div class="tile">
              {#if letter}
                <span
                  class:hinted={row.shown < row.length}
                  in:receiveLetter|global={{ key: position, delay: position * TILE_STAGGER }}
                >
                  {letter}
                </span>
              {/if}
            </div>
          {/each}
          {#if ondefine && row.word && row.shown === row.length}
            {@const word = row.word}
            <button
              class="define"
              aria-label={strings.definitionOf(word)}
              onclick={() => ondefine(word)}
            ></button>
          {/if}
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
    position: relative;
    display: flex;
    gap: var(--gap);
    border-radius: var(--radius-sm);
  }

  /* Over a found row, so tapping anywhere on it asks what the word means. */
  .define {
    position: absolute;
    inset: 0;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
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

  .hinted {
    background: var(--color-tile);
    box-shadow: inset 0 0 0 2px var(--color-accent);
    color: var(--color-accent-strong);
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
