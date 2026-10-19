<!--
@component
The home screen: where the app opens. Continue the game from here; more is coming
(daily challenge, map, achievements).

- `game`: the player's game, for the current level and totals.
- `onplay()`: continue playing.
- `onmap()`: open the level map.
- `onstats()`: open the achievements and stats.
- `ondaily()`: play today's daily challenge.
- `trialBest`: the best Contrarreloj run, if any.
- `ontrial()`: play Contrarreloj.
-->
<script lang="ts">
  import type { Game } from '../../app/game.svelte';
  import { ACHIEVEMENTS } from '../../core/achievements';
  import type { RunResult } from '../../core/time-trial';
  import { strings } from '../../i18n';
  import { DURATION, fly } from '../lib/motion';
  import Stars from './Stars.svelte';

  type Props = {
    game: Game;
    onplay: () => void;
    onmap: () => void;
    onstats: () => void;
    ondaily: () => void;
    trialBest: RunResult | null;
    ontrial: () => void;
  };
  let { game, onplay, onmap, onstats, ondaily, trialBest, ontrial }: Props = $props();

  const today = $derived(game.today);
  const weekday = $derived(strings.weekday(today.date));

  const results = $derived(Object.values(game.history));
  const stars = $derived(results.reduce((sum, result) => sum + result.stars, 0));
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
      {strings.level(game.currentLevel)}
      <span class="badge {game.currentTier}">{strings.tiers[game.currentTier]}</span>
    </span>
  </button>

  <button class="card daily" onclick={ondaily}>
    <span class="label">
      {strings.dailyChallenge}
      <small>{weekday} · {strings.tiers[today.tier]}</small>
    </span>
    <span class="detail">
      {#if today.result}
        <Stars stars={today.result.stars} size={14} />
      {/if}
      {#if today.streak > 0}
        <span class="streak">{strings.streak(today.streak)}</span>
      {/if}
      {#if today.freezes > 0}
        <span role="img" aria-label={strings.streakFreeze} title={strings.streakFreeze}>❄️</span>
      {/if}
    </span>
  </button>

  <button class="card" onclick={ontrial}>
    <span class="label">
      {strings.trial}
      <small>{strings.trialTagline}</small>
    </span>
    {#if trialBest}
      <span class="detail">{strings.bestShort(trialBest.points)}</span>
    {/if}
  </button>

  <button class="card" onclick={onmap}>
    <span class="label">{strings.map}</span>
    <span class="detail">{strings.mapSummary(results.length, stars)}</span>
  </button>

  <button class="card" onclick={onstats}>
    <span class="label">{strings.achievements}</span>
    <span class="detail">
      {strings.achievementsCount(game.achievements.length, ACHIEVEMENTS.length)}
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
    gap: var(--space-4);
    min-height: 100dvh;
    max-width: 420px;
    margin: 0 auto;
    padding: max(var(--space-6), env(safe-area-inset-top)) var(--space-6)
      max(var(--space-6), env(safe-area-inset-bottom));
  }

  header {
    margin-bottom: var(--space-4);
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
    color: var(--color-success-strong);
  }
  .medium {
    color: var(--color-accent);
  }
  .hard {
    color: var(--color-bonus-strong);
  }
  .extra {
    color: var(--color-danger-strong);
  }

  .card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-4) var(--space-6);
    border: none;
    border-radius: var(--radius-md);
    background: var(--color-surface);
    box-shadow: var(--shadow-sm);
    color: var(--color-text);
    font: inherit;
    cursor: pointer;
  }

  .card .label {
    display: grid;
    justify-items: start;
    font-size: var(--text-lg);
  }

  .card small {
    color: var(--color-text-muted);
    font-size: var(--text-sm);
  }

  .daily {
    box-shadow:
      inset 0 0 0 2px var(--color-bonus),
      var(--shadow-sm);
  }

  .card .detail {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .streak {
    color: var(--color-text);
    font-weight: var(--weight-bold);
  }

  .card .detail {
    color: var(--color-text-muted);
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
