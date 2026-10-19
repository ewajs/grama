<!--
@component
The player's totals: levels by tier, stars, words and hints. Achievements join it soon.

- `game`: the player's game, for its stats.
- `onback()`: back to the home screen.
-->
<script lang="ts">
  import { fly } from 'svelte/transition';
  import type { Game } from '../../app/game.svelte';
  import { TIERS } from '../../core/difficulty';
  import { strings } from '../../i18n';
  import { DURATION } from '../lib/motion';
  import ScreenHeader from './ScreenHeader.svelte';

  let { game, onback }: { game: Game; onback: () => void } = $props();

  const stats = $derived(game.stats);
  const totals = $derived(
    (['levels', 'stars', 'threeStars', 'words', 'bonus', 'hints'] as const).map((key) => ({
      label: strings.statLabels[key],
      value: stats[key],
    })),
  );
</script>

<main in:fly={{ y: 12, duration: DURATION.slow }}>
  <ScreenHeader title={strings.achievements} {onback} />

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

  .totals {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
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
