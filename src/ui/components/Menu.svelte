<!--
@component
The menu: settings, help and the rest of the game's options, plus credits.

- `preferences`: the player's settings; changes here apply and save right away.
- `installer`: whether and how the app can be installed here.
- `ontutorial()`, `onreport()`, `onreset()`: the player picked one of those options.
- `onclose()`: done.
-->
<script lang="ts">
  import type { Installer } from '../../app/install.svelte';
  import type { Preferences } from '../../app/preferences.svelte';
  import { strings } from '../../i18n';
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
    onreset: () => void;
    onclose: () => void;
  };
  let { preferences, installer, ontutorial, onreport, onreset, onclose }: Props = $props();

  const themes: { value: Theme; label: string }[] = (['auto', 'light', 'dark'] as const).map(
    (value) => ({ value, label: strings.themes[value] }),
  );
</script>

<Dialog title={strings.menu} {onclose}>
  <section>
    <h3>{strings.theme}</h3>
    <Segmented label={strings.theme} options={themes} bind:value={preferences.theme} />
    {#if canVibrate}
      <Toggle label={strings.vibration} bind:checked={preferences.vibration} />
    {/if}
  </section>

  {#if installer.option === 'prompt'}
    <button class="primary" onclick={() => installer.install()}>{strings.install}</button>
  {:else if installer.option === 'ios'}
    <p class="install">{strings.installIos}</p>
  {/if}

  <section class="actions">
    <button class="secondary" onclick={ontutorial}>{strings.howToPlay}</button>
    <button class="secondary" onclick={onreport}>{strings.report}</button>
    <button class="secondary" onclick={onreset}>{strings.resetProgress}</button>
  </section>

  <button class="primary" onclick={onclose}>{strings.backToGame}</button>

  <footer>
    <p>{strings.about(__BUILD__)}</p>
    <p>
      {strings.credits}
      <a href={strings.licensesUrl} target="_blank" rel="noopener">{strings.licenses}</a>
    </p>
  </footer>
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

  .install {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--text-sm);
  }

  .actions {
    margin: var(--space-2) 0;
  }

  footer {
    color: var(--color-text-muted);
    font-size: var(--text-sm);
  }

  footer p {
    margin: var(--space-1) 0 0;
  }

  a {
    color: var(--color-accent);
  }
</style>
