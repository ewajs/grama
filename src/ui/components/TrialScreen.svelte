<!--
@component
Contrarreloj: wheel after wheel against the clock (D19). The clock runs while the screen
is open and the app is visible; when time is up, a summary offers another run.

- `words`: the language's words, for the wheels.
- `preferences`: sound and vibration.
- `best`: the best run so far, if any, to show with the result.
- `unlocked`: the achievements reached, so new ones are announced.
- `onword(word)`: a word was found (normalized), for Tu diccionario; says whether it was
  new there.
- `onfinish(result)`: a run ended; its result, to keep.
- `onback()`: back to the home screen (a run in play is dropped).
-->
<script lang="ts">
  import { untrack } from 'svelte';
  import type { Preferences } from '../../app/preferences.svelte';
  import { Trial } from '../../app/time-trial.svelte';
  import type { AchievementId } from '../../core/achievements';
  import type { Submission } from '../../core/evaluate';
  import { shuffled } from '../../core/random';
  import { TIME_FOR, type RunResult } from '../../core/time-trial';
  import type { WordList } from '../../content/words';
  import { strings } from '../../i18n';
  import { vibrate } from '../lib/haptics';
  import { wheelKey } from '../lib/keyboard';
  import { FEEDBACK_DURATION } from '../lib/motion';
  import { play } from '../lib/sound';
  import AchievementToast from './AchievementToast.svelte';
  import Board from './Board.svelte';
  import Dialog from './Dialog.svelte';
  import LetterWheel from './LetterWheel.svelte';
  import WordPill from './WordPill.svelte';

  type Props = {
    words: WordList;
    preferences: Preferences;
    best: RunResult | null;
    unlocked: readonly AchievementId[];
    onword: (word: string) => boolean;
    onfinish: (result: RunResult) => void;
    onback: () => void;
  };
  let { words, preferences, best, unlocked, onword, onfinish, onback }: Props = $props();

  // One trial per visit to the screen; "Otra vez" restarts it.
  // svelte-ignore state_referenced_locally
  const trial = new Trial(words);
  let hidden = $state(false);
  let word = $state('');
  let waiting = $state(false);
  let wheel: LetterWheel;
  let result = $state<{ id: number; submission: Submission } | null>(null);
  let resultCount = 0;
  let clearResult: ReturnType<typeof setTimeout> | undefined;
  /** The best run before this one ended, to compare with (`best` then includes this one). */
  let bestBefore = $state<RunResult | null>(null);
  /** Words this run added to Tu diccionario. */
  let newWords = $state(0);
  /** Seconds the last word added, shown by the clock for a moment. */
  let gained = $state<{ id: number; seconds: number } | null>(null);

  let tiles = $derived(trial.level.letters.map((letter, id) => ({ id, letter })));
  const shown = $derived(
    result && {
      id: result.id,
      kind: result.submission.kind,
      word: trial.written(result.submission.word),
    },
  );
  const seconds = $derived(Math.ceil(trial.timeLeft / 1000));

  // The clock: each frame takes the time since the last one. It stops while the app is
  // hidden (or the run is over), and starts afresh when it's back, so no time is lost.
  $effect(() => {
    if (hidden || trial.over) return;
    let last = performance.now();
    let frame = requestAnimationFrame(function step(now) {
      trial.elapse(now - last);
      last = now;
      if (!trial.over) frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  });

  // When time is up: keep the result, once per run.
  $effect(() => {
    if (!trial.over) return;
    untrack(() => {
      bestBefore = best;
      if (preferences.sound) play('complete');
      onfinish(trial.result);
    });
  });

  function spell(next: string, waits: boolean) {
    if (next.length > word.length) {
      if (preferences.vibration) vibrate('letter');
      if (preferences.sound) play('letter', next.length);
    }
    word = next;
    waiting = waits;
    if (next) result = null;
  }

  function submit(next: string) {
    const before = trial.wheelNumber;
    const submission = trial.submit(next);
    if (submission.kind === 'target' || submission.kind === 'bonus') {
      if (onword(submission.word)) newWords++;
      const cleared = trial.wheelNumber !== before;
      gained = {
        id: resultCount + 1,
        seconds: (TIME_FOR[submission.kind] + (cleared ? TIME_FOR.clear : 0)) / 1000,
      };
    }
    if (submission.kind !== 'repeated') {
      if (preferences.vibration) vibrate(submission.kind);
      if (preferences.sound) play(submission.kind);
    }
    result = { id: ++resultCount, submission };
    clearTimeout(clearResult);
    clearResult = setTimeout(() => (result = null), FEEDBACK_DURATION);
  }

  function key(event: KeyboardEvent) {
    if (trial.over) return;
    if (wheelKey(event, wheel, word !== '')) event.preventDefault();
  }
</script>

<svelte:window onkeydown={key} />
<svelte:document onvisibilitychange={() => (hidden = document.visibilityState === 'hidden')} />

<main class="play-screen">
  <header>
    <button class="back" aria-label={strings.back} onclick={onback}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
    </button>
    <div class="title">
      <span>{strings.trial}</span>
      <small>{strings.trialWheel(trial.wheelNumber)}</small>
    </div>
    <div class="clock" class:low={seconds <= 10} role="timer" aria-label={strings.timeLeft}>
      {strings.clock(seconds)}
      {#if gained}
        {#key gained.id}
          <span class="gained">+{gained.seconds} s</span>
        {/key}
      {/if}
    </div>
    <div class="points" aria-label={strings.score}>{trial.points}</div>
  </header>

  <div class="board">
    <Board rows={trial.board} />
  </div>

  <div class="play">
    <WordPill {word} {waiting} onsubmit={() => wheel.submit()} result={shown} />

    <div class="controls">
      <LetterWheel bind:this={wheel} {tiles} onword={spell} onsubmit={submit} />
      <button
        class="round shuffle"
        aria-label={strings.shuffle}
        onclick={() => (tiles = shuffled(tiles))}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 7h3c4 0 6 10 10 10h5M3 17h3c4 0 6-10 10-10h5m-3-3 3 3-3 3m0 4 3 3-3 3" />
        </svg>
      </button>
      <button class="pass" disabled={!trial.canPass} onclick={() => trial.pass()}>
        {strings.pass}
        <small>{strings.passCost}</small>
      </button>
    </div>
  </div>
</main>

<AchievementToast {unlocked} />

{#if trial.over}
  <Dialog title={strings.timeUp}>
    <p class="score">{strings.points(trial.points)}</p>
    <ul>
      <li>{strings.wheelsCleared(trial.result.cleared)}</li>
      <li>{strings.wordsFound(trial.result.words)}</li>
      {#if newWords > 0}
        <li>{strings.dictionaryNew(newWords)}</li>
      {/if}
    </ul>
    {#if bestBefore === null || trial.result.points > bestBefore.points}
      <p class="best">{strings.newBest}</p>
    {:else}
      <p class="best">{strings.bestRun(bestBefore.points)}</p>
    {/if}
    <button
      class="primary"
      onclick={() => {
        newWords = 0;
        trial.restart();
      }}
    >
      {strings.playAgain}
    </button>
    <button class="secondary" onclick={onback}>{strings.backHome}</button>
  </Dialog>
{/if}

<style>
  header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    align-self: stretch;
  }

  .back {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin-left: calc(-1 * var(--space-2));
    padding: 0;
    border: none;
    background: none;
    color: var(--color-text);
    cursor: pointer;
  }

  .back svg {
    width: 24px;
    height: 24px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .title {
    display: grid;
    margin-right: auto;
    font-size: var(--text-lg);
    font-weight: var(--weight-bold);
    line-height: 1.1;
  }

  .title small {
    color: var(--color-text-muted);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
  }

  .clock {
    position: relative;
    font-size: var(--text-xl);
    font-weight: var(--weight-bold);
    font-variant-numeric: tabular-nums;
  }

  .clock.low {
    color: var(--color-danger-strong);
  }

  .gained {
    position: absolute;
    top: 100%;
    left: 50%;
    translate: -50%;
    color: var(--color-success-strong);
    font-size: var(--text-sm);
    white-space: nowrap;
    animation:
      rise var(--dur-slow) var(--ease-out) forwards,
      fade var(--dur-base) 600ms forwards;
  }

  @keyframes rise {
    from {
      translate: -50% 6px;
      opacity: 0;
    }
  }

  @keyframes fade {
    to {
      opacity: 0;
    }
  }

  .points {
    min-width: 3ch;
    margin-left: var(--space-3);
    color: var(--color-accent-strong);
    font-size: var(--text-lg);
    font-weight: var(--weight-bold);
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  .shuffle,
  .pass {
    position: absolute;
    bottom: 0;
  }

  .round {
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
  }

  .shuffle {
    left: 0;
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

  .pass {
    right: 0;
    display: grid;
    place-items: center;
    min-width: 64px;
    min-height: 48px;
    padding: var(--space-1) var(--space-3);
    border: none;
    border-radius: var(--radius-full);
    background: var(--color-surface);
    box-shadow: var(--shadow-sm);
    color: var(--color-text);
    font: inherit;
    font-weight: var(--weight-bold);
    line-height: 1.1;
    cursor: pointer;
  }

  .pass small {
    color: var(--color-danger-strong);
    font-size: 0.75rem;
  }

  .pass:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .score {
    margin: 0;
    color: var(--color-accent-strong);
    font-size: var(--text-2xl);
    font-weight: var(--weight-bold);
  }

  ul {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-full);
    background: var(--color-tile);
    box-shadow: inset 0 0 0 1px var(--color-tile-border);
  }

  .best {
    margin: 0;
    color: var(--color-text-muted);
  }
</style>
