<!--
@component
The home screen, where the app opens: the player's points and hints, the ways to play
(the next level, the daily challenge, Contrarreloj) and the player's progress (the map,
Tu diccionario, achievements). It fits common phones without scrolling.

- `game`: the player's game, for the current level and totals.
- `onplay()`: continue playing.
- `onmap()`: open the level map.
- `onstats()`: open the achievements and stats.
- `ondictionary()`: open Tu diccionario.
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
  import Icon from './Icon.svelte';
  import Stars from './Stars.svelte';

  type Props = {
    game: Game;
    onplay: () => void;
    onmap: () => void;
    onstats: () => void;
    ondictionary: () => void;
    ondaily: () => void;
    trialBest: RunResult | null;
    ontrial: () => void;
  };
  let { game, onplay, onmap, onstats, ondictionary, ondaily, trialBest, ontrial }: Props = $props();

  const today = $derived(game.today);
  const weekday = $derived(strings.weekday(today.date));

  const results = $derived(Object.values(game.history));
  const stars = $derived(results.reduce((sum, result) => sum + result.stars, 0));
</script>

<main in:fly={{ y: 12, duration: DURATION.slow }}>
  <header>
    <img src="{import.meta.env.BASE_URL}icons/icon.svg" alt="" width="64" height="64" />
    <h1>{strings.appName}</h1>
    <p>{strings.tagline}</p>
    <!-- The same star and bulb as in a level; the words are there for screen readers. -->
    <dl>
      <div class="score" title={strings.score}>
        <dt>{strings.score}</dt>
        <dd><Icon name="star" size={18} filled />{game.score}</dd>
      </div>
      <div class="hints" title={strings.hintsLeft}>
        <dt>{strings.hintsLeft}</dt>
        <dd><Icon name="bulb" size={18} />{game.hints}</dd>
      </div>
    </dl>
  </header>

  <section>
    <button class="play" onclick={onplay}>
      <span class="label">{strings.continuePlaying}</span>
      <span class="detail">
        {strings.level(game.currentLevel)}
        <span class="badge {game.currentTier}">{strings.tiers[game.currentTier]}</span>
      </span>
    </button>

    <button class="card daily" onclick={ondaily}>
      <span class="icon"><Icon name="calendar" /></span>
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
      <span class="icon"><Icon name="stopwatch" /></span>
      <span class="label">
        {strings.trial}
        <small>{strings.trialTagline}</small>
      </span>
      {#if trialBest}
        <span class="detail">{strings.bestShort(trialBest.points)}</span>
      {/if}
    </button>
  </section>

  <section class="progress">
    <button class="card" onclick={onmap}>
      <span class="icon"><Icon name="map" /></span>
      <span class="label">{strings.map}</span>
      <span class="detail">{strings.mapSummary(results.length, stars)}</span>
    </button>

    <button class="card" onclick={ondictionary}>
      <span class="icon"><Icon name="book" /></span>
      <span class="label">{strings.dictionary}</span>
      <span class="detail">{strings.dictionaryCount(game.dictionary.length)}</span>
    </button>

    <button class="card" onclick={onstats}>
      <span class="icon"><Icon name="trophy" /></span>
      <span class="label">{strings.achievements}</span>
      <span class="detail">
        {strings.achievementsCount(game.achievements.length, ACHIEVEMENTS.length)}
      </span>
    </button>
  </section>
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: var(--space-6);
    min-height: 100dvh;
    max-width: 420px;
    margin: 0 auto;
    padding: max(var(--space-6), env(safe-area-inset-top))
      max(var(--space-6), env(safe-area-inset-right))
      max(var(--space-6), env(safe-area-inset-bottom))
      max(var(--space-6), env(safe-area-inset-left));
  }

  header {
    display: grid;
    align-content: center;
    justify-items: center;
    gap: var(--space-2);
    text-align: center;
  }

  img {
    border-radius: 22%;
    box-shadow: var(--shadow-md);
  }

  h1 {
    margin: var(--space-1) 0 0;
    font-size: var(--text-2xl);
    line-height: 1.1;
    color: var(--color-accent-strong);
    letter-spacing: 0.04em;
  }

  header p {
    margin: 0;
    color: var(--color-text-muted);
  }

  /* The player's points and hints, as two pills under the tagline. */
  dl {
    display: flex;
    gap: var(--space-2);
    margin: var(--space-2) 0 0;
  }

  dl div {
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-full);
    background: var(--color-surface);
    box-shadow: var(--shadow-sm);
  }

  /* Read by screen readers only: the icon says it on screen. */
  dt {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  dd {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    margin: 0;
    font-weight: var(--weight-bold);
    font-variant-numeric: tabular-nums;
  }

  .score :global(svg) {
    color: var(--color-bonus);
  }

  .hints :global(svg) {
    color: var(--color-bonus-strong);
  }

  section {
    display: grid;
    gap: var(--space-3);
  }

  .progress {
    gap: var(--space-2);
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

  .play:active,
  .card:active {
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
    background: var(--color-surface);
    font-size: 0.7rem;
    font-weight: var(--weight-bold);
    text-transform: uppercase;
  }

  .easy {
    color: var(--color-success-strong);
  }
  .medium {
    color: var(--color-accent-strong);
  }
  .hard {
    color: var(--color-bonus-strong);
  }
  .extra {
    color: var(--color-danger-strong);
  }

  /* An icon, the name (and a line under it), and how it's going on the right. */
  .card {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    min-height: 64px;
    padding: var(--space-3) var(--space-4);
    border: none;
    border-radius: var(--radius-md);
    background: var(--color-surface);
    box-shadow: var(--shadow-sm);
    color: var(--color-text);
    font: inherit;
    text-align: left;
    cursor: pointer;
    transition: scale var(--dur-fast) var(--ease-out);
  }

  .progress .card {
    min-height: 56px;
  }

  .icon {
    display: grid;
    place-items: center;
    flex: none;
    width: 40px;
    height: 40px;
    border-radius: var(--radius-sm);
    background: var(--color-bg-bottom);
    color: var(--color-accent-strong);
  }

  .daily .icon {
    color: var(--color-bonus-strong);
  }

  .card .label {
    display: grid;
    flex: 1;
    font-size: var(--text-lg);
    line-height: 1.2;
  }

  .card small {
    color: var(--color-text-muted);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
  }

  .daily {
    box-shadow:
      inset 0 0 0 2px var(--color-bonus),
      var(--shadow-sm);
  }

  .card .detail {
    flex: none;
    color: var(--color-text-muted);
    font-size: var(--text-sm);
  }

  .streak {
    color: var(--color-text);
    font-weight: var(--weight-bold);
  }

  /* A phone on its side: the header on the left, the buttons on the right. */
  @media (orientation: landscape) and (max-height: 600px) {
    main {
      display: grid;
      grid-template-columns: 1fr 1fr;
      align-content: center;
      gap: var(--space-3) var(--space-8);
      max-width: 860px;
    }

    header {
      grid-row: span 2;
    }

    .play {
      padding: var(--space-4);
    }
  }
</style>
