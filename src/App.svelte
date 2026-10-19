<!-- @component Root of the app: loads the words, then starts or resumes the game. -->
<script lang="ts">
  import { Game } from './app/game.svelte';
  import { Installer } from './app/install.svelte';
  import { Navigation } from './app/navigation.svelte';
  import { Preferences } from './app/preferences.svelte';
  import { levelFromUrl, startState } from './app/start';
  import { loadWords } from './content';
  import { strings } from './i18n';
  import { loadGame, saveGame } from './storage/save';
  import { loadSettings, saveSettings } from './storage/settings';
  import GameScreen from './ui/components/GameScreen.svelte';
  import Home from './ui/components/Home.svelte';
  import LevelMap from './ui/components/LevelMap.svelte';
  import UpdatePrompt from './ui/components/UpdatePrompt.svelte';

  const words = loadWords();
  const settings = loadSettings();
  const levelInUrl = levelFromUrl(location.search);
  const start = startState(loadGame(), levelInUrl, settings.difficulty);
  // Once applied, ?nivel= leaves the URL so a reload continues instead of jumping again.
  history.replaceState(null, '', location.pathname);
  // ?nivel= is for playtesting: straight into that level.
  const navigation = new Navigation(levelInUrl === null ? 'home' : 'game');

  const preferences = new Preferences(settings, saveSettings);
  const installer = new Installer();

  // The browser bar's color for each theme (the page background's top).
  const BAR_COLOR = { light: '#f7f6fc', dark: '#16152a' };

  // $effect runs after rendering and again whenever what it reads changes: here, the
  // theme. It's for reaching outside the component, like the <html> element.
  $effect(() => {
    const { theme } = preferences;
    if (theme === 'auto') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = theme;
    for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
      const scheme = meta.media.includes('dark') ? 'dark' : 'light';
      meta.content = BAR_COLOR[theme === 'auto' ? scheme : theme];
    }
  });
</script>

{#await words}
  <p class="status">{strings.loading}</p>
{:then words}
  <!-- One game for the whole visit, kept while moving between screens. -->
  {@const game = new Game(words, start, saveGame)}
  {#if navigation.screen === 'game'}
    <GameScreen {game} {preferences} {installer} onback={() => navigation.back()} />
  {:else if navigation.screen === 'map'}
    <LevelMap
      {game}
      onplay={(levelNumber) => {
        game.replay(levelNumber);
        navigation.go('game');
      }}
      onback={() => navigation.back()}
    />
  {:else}
    <Home
      {game}
      onplay={() => {
        game.endReplay();
        navigation.go('game');
      }}
      onmap={() => navigation.go('map')}
    />
  {/if}
{:catch}
  <p class="status">{strings.loadError}</p>
{/await}

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
