<!--
@component
Tutorial animation: a small board whose rows fill as words are found. Loops.
-->
<script lang="ts">
  // Each row: its letters, and when (share of the cycle) they appear; null stays empty.
  const rows = [
    { word: 'SOL', at: 0.12 },
    { word: 'SAL', at: 0.42 },
    { word: 'COLA', at: null },
  ];
</script>

<div class="board" aria-hidden="true">
  {#each rows as row (row.word)}
    <div class="row">
      {#each row.word as letter, index (index)}
        <div class="tile">
          {#if row.at !== null}
            <span style:animation-delay="calc({row.at} * var(--cycle) + {index} * 90ms)">
              {letter}
            </span>
          {/if}
        </div>
      {/each}
    </div>
  {/each}
</div>

<style>
  .board {
    --cycle: 3.2s;
    --tile: 40px;
    display: grid;
    justify-items: center;
    gap: 6px;
    padding: var(--space-4) 0;
  }

  .row {
    display: flex;
    gap: 6px;
  }

  .tile {
    position: relative;
    width: var(--tile);
    height: var(--tile);
    border: 1px solid var(--color-tile-border);
    border-radius: calc(var(--tile) * 0.18);
    background: var(--color-tile);
  }

  /* The delay only offsets the start; each letter then loops on the same cycle. */
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
    opacity: 0;
    animation: found var(--cycle) var(--ease-out) infinite backwards;
  }

  @keyframes found {
    0% {
      opacity: 0;
      scale: 0.4;
    }
    6%,
    70% {
      opacity: 1;
      scale: 1;
    }
    80%,
    100% {
      opacity: 0;
      scale: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    span {
      animation: none;
      opacity: 1;
    }
  }
</style>
