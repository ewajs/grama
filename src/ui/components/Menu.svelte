<!--
@component
The menu: settings, help and the rest of the game's options, plus credits.

- `preferences`: the player's settings; changes here apply and save right away.
- `installer`: whether and how the app can be installed here.
- `ontutorial()`, `onreport()`, `onabout()`: the player picked one of those options.
- `onclose()`: done.
-->
<script lang="ts">
  import type { Installer } from '../../app/install.svelte';
  import type { Preferences } from '../../app/preferences.svelte';
  import { strings } from '../../i18n';
  import type { Difficulty } from '../../core/cadence';
  import type { Theme } from '../../storage/settings';
  import Dialog from './Dialog.svelte';
  import { canVibrate } from '../lib/haptics';
  import Segmented from './Segmented.svelte';
  import Toggle from './Toggle.svelte';

  type Props = {
    preferences: Preferences;
    installer: Installer;
    ontutorial: () => void;
    onreport: () => void;
    onabout: () => void;
    onclose: () => void;
  };
  let { preferences, installer, ontutorial, onreport, onabout, onclose }: Props = $props();

  const difficulties: { value: Difficulty; label: string }[] = (
    ['relaxed', 'normal', 'challenging'] as const
  ).map((value) => ({ value, label: strings.difficulties[value] }));

  const themes: { value: Theme; label: string }[] = (['auto', 'light', 'dark'] as const).map(
    (value) => ({ value, label: strings.themes[value] }),
  );
</script>

<Dialog title={strings.menu} {onclose}>
  <section>
    <h3>{strings.difficulty}</h3>
    <Segmented
      label={strings.difficulty}
      options={difficulties}
      bind:value={preferences.difficulty}
    />
    <p class="note">{strings.difficultyNote}</p>
  </section>

  <section>
    <h3>{strings.theme}</h3>
    <Segmented label={strings.theme} options={themes} bind:value={preferences.theme} />
    <Toggle label={strings.sound} bind:checked={preferences.sound} />
    {#if canVibrate}
      <Toggle label={strings.vibration} bind:checked={preferences.vibration} />
    {/if}
  </section>

  {#if installer.option === 'prompt'}
    <button class="primary" onclick={() => installer.install()}>{strings.install}</button>
  {:else if installer.option === 'ios'}
    <p class="install">{strings.installIos}</p>
  {/if}

  <button class="secondary" onclick={ontutorial}>{strings.howToPlay}</button>
  <button class="primary" onclick={onclose}>{strings.backToGame}</button>

  <nav>
    <a href="{import.meta.env.BASE_URL}guia/" target="_blank" rel="noopener">{strings.guide}</a>
    <button onclick={onreport}>{strings.report}</button>
    <button onclick={onabout}>{strings.about}</button>
  </nav>
</Dialog>

<style>
  section {
    display: grid;
    gap: var(--space-2);
    text-align: left;
  }

  h3 {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
  }

  .note {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--text-sm);
  }

  .install {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--text-sm);
  }

  /* Less-used options: small links at the bottom. */
  nav {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--space-1) var(--space-4);
    margin-top: var(--space-2);
    font-size: var(--text-sm);
  }

  nav a,
  nav button {
    padding: var(--space-1) 0;
    border: none;
    background: none;
    color: var(--color-text-muted);
    font: inherit;
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }
</style>
