<!--
@component
The player's achievements, earned and still to earn, and their totals: levels by tier,
stars, words and hints.

- `game`: the player's game, for its stats.
- `onback()`: back to the home screen.
-->
<script lang="ts">
  import type { Game } from '../../app/game.svelte';
  import { achievementProgress, ACHIEVEMENTS } from '../../core/achievements';
  import { TIERS } from '../../core/difficulty';
  import { strings } from '../../i18n';
  import { DURATION, fly } from '../lib/motion';
  import ScreenHeader from './ScreenHeader.svelte';

  let { game, onback }: { game: Game; onback: () => void } = $props();

  const stats = $derived(game.stats);
  const done = $derived(ACHIEVEMENTS.filter((item) => achievementProgress(item, stats) === 1));
  const totals = $derived(
    (
      ['levels', 'dailies', 'bestStreak', 'stars', 'threeStars', 'words', 'bonus', 'hints'] as const
    ).map((key) => ({
      label: strings.statLabels[key],
      value: stats[key],
    })),
  );
</script>

<main in:fly={{ y: 12, duration: DURATION.slow }}>
  <ScreenHeader title={strings.achievements} {onback} />

  <section>
    <h2>
      {strings.achievementsUnlocked(done.length, ACHIEVEMENTS.length)}
    </h2>
    <ul class="achievements">
      {#each ACHIEVEMENTS as achievement (achievement.id)}
        {@const progress = achievementProgress(achievement, stats)}
        {@const [title, description] = strings.achievementList[achievement.id]}
        <li class:done={progress === 1}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M8 21h8m-4-4v4M7 4h10v5a5 5 0 0 1-10 0V4Zm0 2H4v1a3 3 0 0 0 3 3m10-4h3v1a3 3 0 0 1-3 3"
            />
          </svg>
          <div>
            <b>{title}</b>
            <span>{description}</span>
            {#if progress < 1}
              <progress value={progress} aria-label={title}></progress>
            {/if}
          </div>
        </li>
      {/each}
    </ul>
  </section>

  <section>
    <h2>{strings.statsTitle}</h2>
    <dl class="totals">
      {#each totals as total (total.label)}
        <div>
          <dt>{total.label}</dt>
          <dd>{total.value}</dd>
        </div>
      {/each}
    </dl>
    <ul class="tiers">
      {#each TIERS as tier (tier)}
        <li class={tier}>
          <span>{strings.tiers[tier]}</span>
          <b>{stats.byTier[tier]}</b>
        </li>
      {/each}
    </ul>
  </section>
</main>

<style>
  main {
    max-width: 480px;
    margin: 0 auto;
    padding: max(var(--space-3), env(safe-area-inset-top)) var(--space-4)
      max(var(--space-6), env(safe-area-inset-bottom));
  }

  h2 {
    margin: var(--space-4) 0 var(--space-3);
    color: var(--color-text-muted);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
  }

  .achievements {
    display: grid;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .achievements li {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    box-shadow: var(--shadow-sm);
    opacity: 0.7;
  }

  .achievements li.done {
    opacity: 1;
  }

  .achievements svg {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    fill: none;
    stroke: var(--color-tile-border);
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .done svg {
    stroke: var(--color-bonus);
  }

  .achievements div {
    display: grid;
    flex: 1;
    gap: 2px;
  }

  .achievements span {
    color: var(--color-text-muted);
    font-size: var(--text-sm);
  }

  progress {
    width: 100%;
    height: 6px;
    margin-top: var(--space-1);
    appearance: none;
    border: none;
    border-radius: var(--radius-full);
    background: var(--color-tile-border);
    overflow: hidden;
  }

  progress::-webkit-progress-bar {
    background: var(--color-tile-border);
  }

  progress::-webkit-progress-value {
    background: var(--color-accent);
  }

  progress::-moz-progress-bar {
    background: var(--color-accent);
  }

  .totals {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-2);
    margin: 0;
  }

  .totals div {
    padding: var(--space-3) var(--space-2);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    box-shadow: var(--shadow-sm);
    text-align: center;
  }

  dt {
    color: var(--color-text-muted);
    font-size: 0.75rem;
  }

  dd {
    margin: 0;
    font-size: var(--text-xl);
    font-weight: var(--weight-bold);
  }

  .tiers {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-2);
    margin: var(--space-2) 0 0;
    padding: 0;
    list-style: none;
  }

  .tiers li {
    display: grid;
    justify-items: center;
    padding: var(--space-2);
    border-top: 4px solid;
    border-radius: var(--radius-sm);
    background: var(--color-surface);
    box-shadow: var(--shadow-sm);
    font-size: 0.75rem;
  }

  .tiers b {
    font-size: var(--text-lg);
  }

  .easy {
    border-color: var(--color-success);
  }
  .medium {
    border-color: var(--color-accent);
  }
  .hard {
    border-color: var(--color-bonus);
  }
  .extra {
    border-color: var(--color-danger);
  }
</style>
