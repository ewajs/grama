<!--
@component
The screen where a level is played: header, the word being spelled and the letter wheel.

- `game`: the running game; the screen reads it and sends it the player's words.
-->
<script lang="ts">
  import type { Game } from '../../app/game.svelte';
  import { strings } from '../../i18n';
  import { shuffled } from '../lib/shuffle';
  import LetterWheel from './LetterWheel.svelte';

  let { game }: { game: Game } = $props();

  /** The word being spelled on the wheel right now. */
  let word = $state('');

  // Derived from the level, so a new level brings new letters; shuffling overrides it.
  let tiles = $derived(game.level.letters.map((letter, id) => ({ id, letter })));
</script>

<main>
  <header>
    <span>{strings.level(game.levelNumber)}</span>
    <span aria-label={strings.score}>★ {game.score}</span>
  </header>

  <section class="board"></section>

  <div class="pill" class:visible={word !== ''}>{word}</div>

  <div class="controls">
    <LetterWheel {tiles} onword={(next) => (word = next)} onsubmit={(next) => game.submit(next)} />
    <button class="shuffle" aria-label={strings.shuffle} onclick={() => (tiles = shuffled(tiles))}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 7h3c4 0 6 10 10 10h5M3 17h3c4 0 6-10 10-10h5m-3-3 3 3-3 3m0 4 3 3-3 3" />
      </svg>
    </button>
  </div>
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-4);
    height: 100dvh;
    max-width: 480px;
    margin: 0 auto;
    padding: var(--space-4) var(--space-4) var(--space-8);
  }

  header {
    display: flex;
    justify-content: space-between;
    align-self: stretch;
    font-size: var(--text-lg);
    font-weight: var(--weight-medium);
  }

  .board {
    flex: 1;
  }

  .controls {
    position: relative;
    display: grid;
    place-items: center;
    align-self: stretch;
  }

  .shuffle {
    position: absolute;
    bottom: 0;
    left: 0;
    display: grid;
    place-items: center;
    width: 48px;
    height: 48px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: var(--color-surface);
    box-shadow: var(--shadow-sm);
    color: var(--color-text-muted);
    cursor: pointer;
    transition: scale var(--dur-fast) var(--ease-out);
  }

  .shuffle:active {
    scale: 0.92;
  }

  .shuffle svg {
    width: 24px;
    height: 24px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .pill {
    min-width: 6rem;
    min-height: 2.75rem;
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-full);
    background: var(--color-accent);
    color: var(--color-accent-contrast);
    font-size: var(--text-xl);
    font-weight: var(--weight-bold);
    letter-spacing: 0.08em;
    text-align: center;
    opacity: 0;
    transition: opacity var(--dur-fast);
  }

  .pill.visible {
    opacity: 1;
  }
</style>
