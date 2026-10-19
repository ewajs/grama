<!--
@component
The screen where a level is played: header, the word being spelled and the letter wheel.

- `game`: the running game; the screen reads it and sends it the player's words.
-->
<script lang="ts">
  import type { Game } from '../../app/game.svelte';
  import { strings } from '../../i18n';
  import LetterWheel from './LetterWheel.svelte';

  let { game }: { game: Game } = $props();

  /** The word being spelled on the wheel right now. */
  let word = $state('');

  const tiles = $derived(game.level.letters.map((letter, id) => ({ id, letter })));
</script>

<main>
  <header>
    <span>{strings.level(game.levelNumber)}</span>
    <span aria-label={strings.score}>★ {game.score}</span>
  </header>

  <section class="board"></section>

  <div class="pill" class:visible={word !== ''}>{word}</div>

  <LetterWheel {tiles} onword={(next) => (word = next)} onsubmit={(next) => game.submit(next)} />
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
