<!--
@component
Celebrates a finished level over the game screen, with what was won, and moves on. The
stars land one by one, then the points count up.

- `detail`: what was finished: "Completaste el nivel 12".
- `tier`: how hard it was; harder levels list their rewards.
- `stars`: stars earned on it.
- `missing`: what it lacked for three stars, said when it got fewer.
- `words`: its targets, as written, each linking to its definition.
- `points`: points won on it; none means a replay, which pays nothing.
- `hints`: hints won by finishing it.
- `bonus`: bonus words found on it; none isn't mentioned.
- `nextLabel`: the button's label (the next level, or back to the map after a replay).
- `share()`: when given, a share button (daily challenge); it says how it went.
- `onnext()`: the player is done here.
-->
<script lang="ts">
  import { cubicOut } from 'svelte/easing';
  import { Tween } from 'svelte/motion';
  import type { Tier } from '../../core/difficulty';
  import { TIER_MULTIPLIER } from '../../core/evaluate';
  import type { MissingStars } from '../../core/history';
  import { strings } from '../../i18n';
  import { CELEBRATION_DELAY, SCORE_COUNT_DURATION, STAR_STAGGER } from '../lib/motion';
  import { definitionUrl } from '../../app/dictionary';
  import Confetti from './Confetti.svelte';
  import Dialog from './Dialog.svelte';
  import Stars from './Stars.svelte';

  type Props = {
    detail: string;
    tier: Tier;
    stars: number;
    missing: MissingStars;
    words: readonly string[];
    points: number;
    hints: number;
    bonus: number;
    nextLabel: string;
    share?: () => Promise<'shared' | 'copied' | 'failed'>;
    onnext: () => void;
  };
  let {
    detail,
    tier,
    stars,
    missing,
    words,
    points,
    hints,
    bonus,
    nextLabel,
    share,
    onnext,
  }: Props = $props();

  let copied = $state(false);

  // The points count up from 0 once the three stars have landed.
  const counted = new Tween(0, { duration: SCORE_COUNT_DURATION * 2, easing: cubicOut });
  $effect(() => {
    counted.set(points, { delay: CELEBRATION_DELAY + 3 * STAR_STAGGER });
  });
</script>

<Dialog title={strings.levelComplete} delay={CELEBRATION_DELAY}>
  {#snippet behind()}
    <Confetti delay={CELEBRATION_DELAY} />
  {/snippet}
  <p>{detail}</p>
  <div class="stars"><Stars {stars} size={44} delay={CELEBRATION_DELAY} /></div>
  {#if stars < 3}
    <p class="how">{strings.starsMissing(missing)}</p>
  {/if}
  <ul>
    {#if points === 0}
      <li class="points">{strings.replayPays}</li>
    {:else}
      {#if tier === 'hard' || tier === 'extra'}
        <li class="tier {tier}">
          {strings.tiers[tier]} · {strings.tierReward(TIER_MULTIPLIER[tier])}
        </li>
      {/if}
      <li class="points" aria-label={strings.pointsWon(points)}>
        {strings.pointsWon(Math.round(counted.current))}
      </li>
    {/if}
    {#if bonus > 0}
      <li class="bonus">{strings.bonusWords(bonus)}</li>
    {/if}
    {#if hints > 0}
      <li class="hint">{strings.hintsWon(hints)}</li>
    {/if}
  </ul>
  <section class="recap">
    <h3>{strings.recap}</h3>
    <div>
      {#each words as word (word)}
        <a
          href={definitionUrl(word)}
          target="_blank"
          rel="noopener"
          aria-label={strings.definitionOf(word)}>{word}</a
        >
      {/each}
    </div>
  </section>
  {#if share}
    <button
      class="primary"
      onclick={async () => {
        copied = (await share()) === 'copied';
      }}
    >
      {copied ? strings.copied : strings.share}
    </button>
    <button class="secondary" onclick={onnext}>{nextLabel}</button>
  {:else}
    <button class="primary" onclick={onnext}>{nextLabel}</button>
  {/if}
</Dialog>

<style>
  p {
    margin: 0;
    color: var(--color-text-muted);
  }

  .recap {
    margin: 0 0 var(--space-2);
  }

  .recap h3 {
    margin: 0 0 var(--space-2);
    color: var(--color-text-muted);
    font-size: 0.75rem;
    font-weight: var(--weight-medium);
  }

  .recap div {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--space-1);
  }

  .recap a {
    padding: 2px var(--space-2);
    border-radius: var(--radius-sm);
    background: var(--color-accent);
    color: var(--color-accent-contrast);
    font-size: var(--text-sm);
    font-weight: var(--weight-bold);
    letter-spacing: 0.04em;
    text-decoration: none;
  }

  .stars {
    margin: var(--space-2) 0 0;
  }

  .how {
    font-size: var(--text-sm);
  }

  ul {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--space-2);
    margin: var(--space-2) 0 var(--space-4);
    padding: 0;
    list-style: none;
    font-weight: var(--weight-medium);
  }

  li {
    padding: var(--space-1) var(--space-3);
    font-variant-numeric: tabular-nums;
    border-radius: var(--radius-full);
    background: var(--color-tile);
    box-shadow: inset 0 0 0 1px var(--color-tile-border);
  }

  .points {
    color: var(--color-success-strong);
  }

  .bonus,
  .hint {
    color: var(--color-bonus-strong);
  }

  .tier {
    color: var(--color-accent-contrast);
    box-shadow: none;
  }

  .tier.hard {
    background: var(--color-bonus-strong);
  }

  .tier.extra {
    background: var(--color-danger-strong);
  }
</style>
