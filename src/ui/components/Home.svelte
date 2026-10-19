<!--
@component
The home screen: where the app opens. Continue the game from here; more is coming
(daily challenge, map, achievements).

- `game`: the player's game, for the current level and totals.
- `onplay()`: continue playing.
-->
<script lang="ts">
  import { fly } from 'svelte/transition';
  import type { Game } from '../../app/game.svelte';
  import { strings } from '../../i18n';
  import { DURATION } from '../lib/motion';

  let { game, onplay }: { game: Game; onplay: () => void } = $props();
</script>

<main in:fly={{ y: 12, duration: DURATION.slow }}>
  <header>
    <img src="{import.meta.env.BASE_URL}icons/icon.svg" alt="" width="72" height="72" />
    <h1>{strings.appName}</h1>
    <p>{strings.tagline}</p>
  </header>

  <button class="play" onclick={onplay}>
    <span class="label">{strings.continuePlaying}</span>
    <span class="detail">
      {strings.level(game.levelNumber)}
      <span class="badge {game.tier}">{strings.tiers[game.tier]}</span>
    </span>
  </button>

  <dl>
    <div>
      <dt>{strings.score}</dt>
      <dd>{game.score}</dd>
    </div>
    <div>
      <dt>{strings.hintsLeft}</dt>
      <dd>{game.hints}</dd>
    </div>
  </dl>
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: var(--space-8);
    min-height: 100dvh;
    max-width: 420px;
    margin: 0 auto;
    padding: max(var(--space-6), env(safe-area-inset-top)) var(--space-6)
      max(var(--space-6), env(safe-area-inset-bottom));
  }

  header {
    display: grid;
    justify-items: center;
    gap: var(--space-2);
    text-align: center;
  }

  img {
    border-radius: 22%;
    box-shadow: var(--shadow-md);
  }

  h1 {
    margin: var(--space-2) 0 0;
    font-size: var(--text-2xl);
    color: var(--color-accent);
    letter-spacing: 0.04em;
  }

  header p {
    margin: 0;
    color: var(--color-text-muted);
  }

  .play {
    display: grid;
    gap: var(--space-1);
    justify-items: center;
    padding: var(--space-6);
    border: none;
    border-radius: var(--radius-md);
    background: var(--color-accent);
    box-shadow: var(--shadow-md);
    color: var(--color-accent-contrast);
    font: inherit;
    cursor: pointer;
    transition: scale var(--dur-fast) var(--ease-out);
  }

  .play:active {
    scale: 0.97;
  }

  .label {
    font-size: var(--text-xl);
    font-weight: var(--weight-bold);
  }

  .detail {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    opacity: 0.9;
  }

  .badge {
    padding: 1px var(--space-2);
    border-radius: var(--radius-full);
    background: var(--color-accent-contrast);
    font-size: 0.7rem;
    font-weight: var(--weight-bold);
    text-transform: uppercase;
  }

  .easy {
    color: var(--color-success);
  }
  .medium {
    color: var(--color-accent);
  }
  .hard {
    color: var(--color-bonus);
  }
  .extra {
    color: var(--color-danger);
  }

  dl {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-3);
    margin: 0;
  }

  dl div {
    padding: var(--space-3);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    box-shadow: var(--shadow-sm);
    text-align: center;
  }

  dt {
    color: var(--color-text-muted);
    font-size: var(--text-sm);
  }

  dd {
    margin: 0;
    font-size: var(--text-xl);
    font-weight: var(--weight-bold);
  }
</style>
