<!-- @component Root of the app: loads the words, then starts or resumes the game. -->
<script lang="ts">
  import { Game } from './app/game.svelte';
  import { Installer } from './app/install.svelte';
  import { Navigation } from './app/navigation.svelte';
  import { Preferences } from './app/preferences.svelte';
  import { levelFromUrl, startState } from './app/start';
  import { loadWords } from './content';
  import { strings } from './i18n';
  import { loadDictionary, saveDictionary } from './storage/dictionary';
  import { loadGame, saveGame } from './storage/save';
  import { loadTrials, saveTrials } from './storage/trials';
  import { loadSettings, saveSettings, type Theme } from './storage/settings';
  import GameScreen from './ui/components/GameScreen.svelte';
  import Home from './ui/components/Home.svelte';
  import LevelMap from './ui/components/LevelMap.svelte';
  import StatsScreen from './ui/components/StatsScreen.svelte';
  import TrialScreen from './ui/components/TrialScreen.svelte';
  import type { WordList } from './content/words';
  import UpdatePrompt from './ui/components/UpdatePrompt.svelte';

  const settings = loadSettings();
  const levelInUrl = levelFromUrl(location.search);
  const start = startState(loadGame(), levelInUrl, settings.difficulty);
  // One game for the whole visit, kept while moving between screens. It starts at once,
  // so the home screen shows while the words download; only playing a level needs them.
  const game = new Game(start, {
    onchange: saveGame,
    trials: loadTrials(),
    ontrials: saveTrials,
    dictionary: loadDictionary(),
    ondictionary: saveDictionary,
  });
  let words = $state<WordList | null>(null);
  let failed = $state(false);
  loadWords().then(
    (loaded) => {
      game.words = loaded;
      words = loaded;
    },
    () => (failed = true),
  );

  // Once applied, ?nivel= leaves the URL so a reload continues instead of jumping again.
  history.replaceState(null, '', location.pathname);
  // ?nivel= is for playtesting: straight into that level.
  const navigation = new Navigation(levelInUrl === null ? 'home' : 'game');

  const preferences = new Preferences(settings, saveSettings);
  const installer = new Installer();

  // The browser bar's color for each theme and mode: its --color-bg-top in tokens.css.
  const BAR_COLOR: Record<Theme, { light: string; dark: string }> = {
    grama: { light: '#f7f6fc', dark: '#16152a' },
    argento: { light: '#f5f9fd', dark: '#11243a' },
    yerba: { light: '#fbf8ef', dark: '#1a2014' },
    quebrada: { light: '#fcf6f1', dark: '#2a1a14' },
  };

  // $effect runs after rendering and again whenever what it reads changes: here, the
  // theme and mode. It's for reaching outside the component, like the <html> element.
  $effect(() => {
    const { theme, mode } = preferences;
    const root = document.documentElement;
    root.dataset.theme = theme;
    if (mode === 'auto') delete root.dataset.mode;
    else root.dataset.mode = mode;
    for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
      const scheme = meta.media.includes('dark') ? 'dark' : 'light';
      meta.content = BAR_COLOR[theme][mode === 'auto' ? scheme : mode];
    }
  });

  // Back from the background (a PWA can sleep for days), the daily may have changed.
  $effect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') game.refreshDate();
    };
    document.addEventListener('visibilitychange', refresh);
    return () => document.removeEventListener('visibilitychange', refresh);
  });
</script>

{#if navigation.screen === 'game'}
  {#if game.ready}
    <GameScreen {game} {preferences} {installer} onback={() => navigation.back()} />
  {:else if failed}
    <p class="status">{strings.loadError}</p>
  {:else}
    <p class="status">{strings.loading}</p>
  {/if}
{:else if navigation.screen === 'trial'}
  {#if words}
    <TrialScreen
      {words}
      {preferences}
      best={game.trialBest}
      unlocked={game.achievements}
      onword={(word) => game.addToDictionary(word)}
      onfinish={(result) => game.recordRun(result)}
      onback={() => navigation.back()}
    />
  {:else if failed}
    <p class="status">{strings.loadError}</p>
  {:else}
    <p class="status">{strings.loading}</p>
  {/if}
{:else if navigation.screen === 'map'}
  <LevelMap
    {game}
    onplay={(levelNumber) => {
      game.replay(levelNumber);
      navigation.go('game');
    }}
    onback={() => navigation.back()}
  />
{:else if navigation.screen === 'stats'}
  <StatsScreen {game} onback={() => navigation.back()} />
{:else}
  <Home
    {game}
    onplay={() => {
      game.playCurrent();
      navigation.go('game');
    }}
    onmap={() => navigation.go('map')}
    onstats={() => navigation.go('stats')}
    trialBest={game.trialBest}
    ontrial={() => navigation.go('trial')}
    ondaily={() => {
      game.playDaily();
      navigation.go('game');
    }}
  />
{/if}

<UpdatePrompt />

<style>
  .status {
    display: grid;
    place-items: center;
    min-height: 100dvh;
    margin: 0;
    padding: var(--space-6);
    color: var(--color-text-muted);
    text-align: center;
  }
</style>
