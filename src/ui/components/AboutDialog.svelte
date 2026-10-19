<!--
@component
About Grama: the version, what's new, checking for updates, credits and licenses, and
starting over.

- `onreset()`: the player wants to start over (it asks for confirmation).
- `onclose()`: done.
-->
<script lang="ts">
  import { checkForUpdate, type UpdateCheck } from '../../app/updates';
  import { strings } from '../../i18n';
  import Dialog from './Dialog.svelte';

  let { onreset, onclose }: { onreset: () => void; onclose: () => void } = $props();

  let checking = $state(false);
  let check = $state<UpdateCheck | null>(null);

  async function lookForUpdate() {
    checking = true;
    check = await checkForUpdate();
    checking = false;
  }
</script>

<Dialog title={strings.aboutTitle} {onclose}>
  <img src="{import.meta.env.BASE_URL}icons/icon.svg" alt="" width="56" height="56" />
  <p class="version">{strings.version(__VERSION__, __BUILD__)}</p>
  <p>{strings.tagline}</p>

  <button class="secondary" disabled={checking} onclick={lookForUpdate}>
    {checking ? strings.checkingUpdates : strings.checkUpdates}
  </button>
  {#if check}
    <p class="status" role="status">{strings.updateChecks[check]}</p>
  {/if}

  <section>
    <h3>{strings.whatsNew}</h3>
    {#each strings.news as release (release.version)}
      <h4>{release.version}</h4>
      <ul>
        {#each release.items as item (item)}
          <li>{item}</li>
        {/each}
      </ul>
    {/each}
  </section>

  <section>
    <h3>{strings.creditsTitle}</h3>
    <p class="small">
      {strings.credits}
      <a href={strings.licensesUrl} target="_blank" rel="noopener">{strings.licenses}</a> ·
      <a href={strings.sourceUrl} target="_blank" rel="noopener">{strings.source}</a>
    </p>
  </section>

  <button class="primary" onclick={onclose}>{strings.close}</button>
  <button class="reset" onclick={onreset}>{strings.resetProgress}</button>
</Dialog>

<style>
  img {
    justify-self: center;
    border-radius: 22%;
  }

  p {
    margin: 0;
    color: var(--color-text-muted);
  }

  .version {
    color: var(--color-text);
    font-weight: var(--weight-medium);
  }

  .status {
    font-size: var(--text-sm);
  }

  section {
    text-align: left;
  }

  h3 {
    margin: var(--space-2) 0 var(--space-1);
    color: var(--color-text-muted);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
  }

  h4 {
    margin: var(--space-2) 0 0;
    font-size: var(--text-sm);
  }

  ul {
    margin: var(--space-1) 0 0;
    padding-left: 1.2em;
    font-size: var(--text-sm);
  }

  .small {
    font-size: var(--text-sm);
  }

  a {
    color: var(--color-accent);
  }

  .reset {
    min-height: 36px;
    border: none;
    background: none;
    color: var(--color-danger);
    font: inherit;
    font-size: var(--text-sm);
    cursor: pointer;
  }
</style>
