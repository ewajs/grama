<!--
@component
The level map: every level reached, colored by tier, with its stars. Tapping a level
plays it: the current one to continue, an earlier one to replay it for better stars.

- `game`: the player's game, for the history and current level.
- `onplay(levelNumber)`: play that level.
- `onback()`: back to the home screen.
-->
<script lang="ts">
  import { fly } from 'svelte/transition';
  import type { Game } from '../../app/game.svelte';
  import { strings } from '../../i18n';
  import { DURATION } from '../lib/motion';
  import ScreenHeader from './ScreenHeader.svelte';
  import Stars from './Stars.svelte';

  type Props = { game: Game; onplay: (levelNumber: number) => void; onback: () => void };
  let { game, onplay, onback }: Props = $props();

  const levels = $derived(Array.from({ length: game.currentLevel }, (_, index) => index + 1));

  let current = $state<HTMLElement>();
  // Opens scrolled to where the player is. Runs once the button exists.
  $effect(() => current?.scrollIntoView({ block: 'center' }));
</script>

<main in:fly={{ y: 12, duration: DURATION.slow }}>
  <ScreenHeader title={strings.map} {onback} sticky />

  <ol>
    {#each levels as levelNumber (levelNumber)}
      {@const result = game.history[levelNumber]}
      <li>
        {#if levelNumber === game.currentLevel}
          <button
            class="level current"
            bind:this={current}
            aria-label={strings.playLevel(levelNumber)}
            onclick={() => onplay(levelNumber)}
          >
            <span class="number">{levelNumber}</span>
            <svg class="play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg
            >
          </button>
        {:else}
          <button
            class="level {result?.tier ?? ''}"
            aria-label={strings.playLevel(levelNumber)}
            onclick={() => onplay(levelNumber)}
          >
            <span class="number">{levelNumber}</span>
            <Stars stars={result?.stars ?? 0} size={11} />
          </button>
        {/if}
      </li>
    {/each}
  </ol>
</main>

<style>
  main {
    max-width: 480px;
    margin: 0 auto;
    padding: max(var(--space-3), env(safe-area-inset-top)) var(--space-4)
      max(var(--space-6), env(safe-area-inset-bottom));
  }

  ol {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
    gap: var(--space-2);
    margin: var(--space-2) 0 0;
    padding: 0;
    list-style: none;
  }

  .level {
    display: grid;
    justify-items: center;
    gap: 2px;
    width: 100%;
    padding: var(--space-2) 0;
    border: none;
    border-top: 4px solid var(--color-tile-border);
    border-radius: var(--radius-sm);
    background: var(--color-surface);
    box-shadow: var(--shadow-sm);
    color: var(--color-text);
    font: inherit;
    cursor: pointer;
  }

  .number {
    font-weight: var(--weight-bold);
  }

  .easy {
    border-top-color: var(--color-success);
  }
  .medium {
    border-top-color: var(--color-accent);
  }
  .hard {
    border-top-color: var(--color-bonus);
  }
  .extra {
    border-top-color: var(--color-danger);
  }

  .current {
    border-top-color: var(--color-accent);
    background: var(--color-accent);
    color: var(--color-accent-contrast);
  }

  .play {
    width: 14px;
    height: 14px;
    fill: currentColor;
  }
</style>
