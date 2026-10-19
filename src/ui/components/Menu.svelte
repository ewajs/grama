<!--
@component
The menu: settings, help and the rest of the game's options, plus credits.

- `preferences`: the player's settings; changes here apply and save right away.
- `onreport()`, `onreset()`: the player picked one of those options.
- `onclose()`: done.
-->
<script lang="ts">
  import type { Preferences } from '../../app/preferences.svelte';
  import { strings } from '../../i18n';
  import type { Theme } from '../../storage/settings';
  import Dialog from './Dialog.svelte';
  import Segmented from './Segmented.svelte';

  type Props = {
    preferences: Preferences;
    onreport: () => void;
    onreset: () => void;
    onclose: () => void;
  };
  let { preferences, onreport, onreset, onclose }: Props = $props();

  const themes: { value: Theme; label: string }[] = (['auto', 'light', 'dark'] as const).map(
    (value) => ({ value, label: strings.themes[value] }),
  );
</script>

<Dialog title={strings.menu} {onclose}>
  <section>
    <h3>{strings.theme}</h3>
    <Segmented label={strings.theme} options={themes} bind:value={preferences.theme} />
  </section>

  <section class="actions">
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
