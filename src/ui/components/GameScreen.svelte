<!--
@component
The screen where a level is played: header, board, the word being spelled and the
letter wheel with its controls.

- `game`: the running game; the screen reads it and sends it the player's words.
- `preferences`: the player's settings, changed from the menu.
- `installer`: for the menu's install option.
- `recorder`: optional local assessment; failures leave play available.
- `onback()`: return to the previous screen.
- `onhome()`: go explicitly to Home after completion.
- `onrated(id)`: read the exact finalized attempt’s rating update.
-->
<script lang="ts">
  import { untrack } from 'svelte';
  import {
    RECORDING_INTERVAL,
    type GramaRecorder,
    type PuzzleRecording,
  } from '../../app/assessment/recorder';
  import type { Game } from '../../app/game.svelte';
  import type { Installer } from '../../app/install.svelte';
  import type { Preferences } from '../../app/preferences.svelte';
  import { shareText } from '../../app/share';
  import { vibrate } from '../lib/haptics';
  import { wheelKey } from '../lib/keyboard';
  import { watchActivity } from '../lib/activity';
  import type { Submission } from '../../core/evaluate';
  import { shuffled } from '../../core/random';
  import { strings } from '../../i18n';
  import { CELEBRATION_DELAY, FEEDBACK_DURATION } from '../lib/motion';
  import { play } from '../lib/sound';
  import Board from './Board.svelte';
  import Header from './Header.svelte';
  import HintButton from './HintButton.svelte';
  import AchievementToast from './AchievementToast.svelte';
  import BonusCounter from './BonusCounter.svelte';
  import BonusWords from './BonusWords.svelte';
  import DefinitionDialog from './DefinitionDialog.svelte';
  import LetterWheel from './LetterWheel.svelte';
  import LevelComplete from './LevelComplete.svelte';
  import MenuDialogs from './MenuDialogs.svelte';
  import type { RatingUpdate } from '../../app/assessment/performance';
  import WordPill from './WordPill.svelte';

  type Props = {
    game: Game;
    preferences: Preferences;
    installer: Installer;
    recorder: GramaRecorder | null;
    onback: () => void;
    onhome: () => void;
    onrated: (id: string) => Promise<RatingUpdate | null>;
  };
  let { game, preferences, installer, recorder, onback, onhome, onrated }: Props = $props();

  /** The dialog open over the game, if any (the level-complete one shows on its own). */
  // The tutorial opens by itself on first launch. `untrack` reads the setting once, on
  // purpose: marking it seen later shouldn't change which panel is open.
  let panel = $state<'menu' | 'tutorial' | 'bonus' | 'definition' | null>(
    untrack(() => (preferences.tutorialSeen ? null : 'tutorial')),
  );
  const close = () => (panel = null);
  /** The word whose definition is offered, when that panel is open. */
  let defining = $state('');
  /** The word being spelled on the wheel right now. */
  let word = $state('');
  /** Whether that word was tapped or typed, and waits to be submitted. */
  let waiting = $state(false);
  let wheel = $state<LetterWheel>();
  /** The last submitted word's result, shown briefly. */
  let result = $state<{ id: number; submission: Submission } | null>(null);
  let resultCount = 0;
  let clearResult: ReturnType<typeof setTimeout> | undefined;

  // Derived from the level, so a new level brings new letters; shuffling overrides it.
  let tiles = $derived(game.level.letters.map((letter, id) => ({ id, letter })));

  const repeated = $derived(result?.submission.kind === 'repeated' ? result.submission.word : null);

  // What the player sees: words as written, with their accents.
  const shown = $derived(
    result && {
      id: result.id,
      kind: result.submission.kind,
      word: game.written(result.submission.word),
    },
  );

  const puzzleKey = $derived(game.recordingKey);
  let preparedKey = $state('');
  let recording = $state.raw<PuzzleRecording | null>(null);
  let interactive = $state(false);
  let forceNew = false;
  let completionRating = $state<RatingUpdate | null>(null);
  const ready = $derived(preparedKey === puzzleKey);

  // The key excludes words and hints. A new puzzle waits only for its initial exposure
  // commit; recorder failure/timeout still resolves, so ordinary play remains available.
  $effect(() => {
    const key = puzzleKey;
    let cancelled = false;
    let own: PuzzleRecording | null = null;
    untrack(() => {
      const snapshot = game.observation,
        restart = forceNew;
      forceNew = false;
      recording = null;
      completionRating = null;
      void Promise.resolve(recorder?.prepare(snapshot, restart) ?? null).then(
        (handle) => {
          if (cancelled) return;
          own = handle;
          recording = handle;
          preparedKey = key;
          if (snapshot.complete) handle?.update(snapshot);
        },
        () => {
          if (!cancelled) preparedKey = key;
        },
      );
    });
    return () => {
      cancelled = true;
      own?.close();
    };
  });

  $effect(() => {
    recording?.active(ready && interactive && panel === null && !game.complete);
  });
  $effect(() => watchActivity((value) => (interactive = value)));

  $effect(() => {
    const timer = setInterval(() => recording?.checkpoint(), RECORDING_INTERVAL);
    return () => clearInterval(timer);
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

  /** Typing on a keyboard, while nothing covers the level. */
  function key(event: KeyboardEvent) {
    if (!ready || !wheel || panel !== null || game.complete) return;
    if (wheelKey(event, wheel, word !== '')) event.preventDefault();
  }

  function home() {
    result = null;
    if (game.replaying || game.daily) game.playCurrent();
    else game.next(preferences.difficulty);
    onhome();
  }

  function nextLevel() {
    result = null;
    if (game.daily) {
      home();
    } else if (game.replaying) {
      game.playCurrent();
      onback();
    } else {
      game.next(preferences.difficulty);
    }
  }

  /** Shares the result of the daily on screen; returns how it went. */
  async function shareDaily(): Promise<'shared' | 'copied' | 'failed'> {
    const daily = game.dailyOnScreen;
    if (!daily) return 'failed';
    return shareText(
      strings.shareText({
        number: daily.number,
        weekday: strings.weekday(daily.date),
        tier: strings.tiers[daily.tier],
        stars: game.stars,
        hints: game.hintsUsed,
        streak: daily.streak,
        url: location.origin + import.meta.env.BASE_URL,
      }),
    );
  }

  function submit(next: string) {
    const submission = game.submit(next);
    if (submission.kind === 'target' || submission.kind === 'bonus') {
      const handle = recording,
        key = puzzleKey;
      const settled = handle?.update(game.observation);
      if (game.complete && handle && settled)
        void settled.then(async (saved) => {
          if (!saved) return;
          const update = await onrated(handle.id);
          if (game.recordingKey === key && game.complete) completionRating = update;
        });
    }
    if (submission.kind !== 'repeated') {
      if (preferences.vibration) vibrate(submission.kind);
      if (preferences.sound) play(submission.kind);
    }
    // In time with the confetti.
    if (preferences.sound && submission.kind === 'target' && game.complete)
      setTimeout(() => play('complete'), CELEBRATION_DELAY);
    result = { id: ++resultCount, submission };
    clearTimeout(clearResult);
    clearResult = setTimeout(() => (result = null), FEEDBACK_DURATION);
  }
</script>

<svelte:window onkeydown={key} />

{#if ready}
  <main class="play-screen">
    <Header
      title={game.daily
        ? strings.dailyTitle(game.levelNumber)
        : game.replaying
          ? `${strings.level(game.levelNumber)} · ${strings.replaying}`
          : strings.level(game.levelNumber)}
      tier={game.tier}
      score={game.score}
      {onback}
      onmenu={() => (panel = 'menu')}
    />

    <div class="board">
      <Board
        rows={game.board}
        glow={repeated && game.written(repeated)}
        ondefine={(word) => {
          defining = word;
          panel = 'definition';
        }}
      />
    </div>

    <div class="play">
      <WordPill {word} {waiting} onsubmit={() => wheel?.submit()} result={shown} />

      <div class="controls">
        <LetterWheel bind:this={wheel} {tiles} onword={spell} onsubmit={submit} />
        <button
          class="shuffle"
          aria-label={strings.shuffle}
          onclick={() => (tiles = shuffled(tiles, Math.random))}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 7h3c4 0 6 10 10 10h5M3 17h3c4 0 6-10 10-10h5m-3-3 3 3-3 3m0 4 3 3-3 3" />
          </svg>
        </button>
        <div class="hint">
          <HintButton
            count={game.hints}
            disabled={!game.canHint}
            onhint={() => {
              game.hint();
              recording?.update(game.observation);
            }}
          />
        </div>
        <div class="bonus">
          <BonusCounter
            count={game.bonusFound}
            progress={game.hintProgress}
            untilHint={game.bonusUntilHint}
            glow={repeated !== null && !game.level.targets.includes(repeated)}
            onopen={() => (panel = 'bonus')}
          />
        </div>
      </div>
    </div>
  </main>

  {#if panel === 'menu' || panel === 'tutorial'}
    <MenuDialogs
      {preferences}
      {installer}
      initial={panel}
      report={(kind) => game.reportUrl(kind)}
      onclose={close}
      onreset={() => {
        result = null;
        forceNew = true;
        game.reset(preferences.difficulty);
      }}
    />
  {:else if panel === 'definition'}
    <DefinitionDialog word={defining} onclose={close} />
  {:else if panel === 'bonus'}
    <BonusWords
      words={game.bonusWords}
      total={game.bonusTotal}
      untilHint={game.bonusUntilHint}
      onclose={close}
    />
  {/if}

  {#if game.complete}
    <LevelComplete
      detail={game.daily
        ? strings.dailyCompleteDetail(game.levelNumber)
        : strings.levelCompleteDetail(game.levelNumber)}
      tier={game.tier}
      stars={game.stars}
      missing={game.missingStars}
      words={game.targetWords}
      nextLabel={game.daily
        ? strings.backHome
        : game.replaying
          ? strings.backToMap
          : strings.nextLevel}
      share={game.daily ? shareDaily : undefined}
      points={game.levelPoints}
      hints={game.hintsWon}
      bonus={game.bonusFound}
      newWords={game.newWords.length}
      ratingUpdate={completionRating}
      onhome={game.daily ? undefined : home}
      onnext={nextLevel}
    />
  {/if}

  <AchievementToast unlocked={game.achievements} />
{:else}
  <p class="loading">{strings.loading}</p>
{/if}

<style>
  .loading {
    display: grid;
    place-items: center;
    min-height: 100dvh;
    margin: 0;
    color: var(--color-text-muted);
  }
  .shuffle,
  .bonus {
    position: absolute;
    bottom: 0;
  }

  .shuffle {
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

  .bonus {
    right: 0;
  }

  .hint {
    position: absolute;
    top: 0;
    right: 0;
  }
</style>
