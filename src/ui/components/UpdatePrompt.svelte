<!--
@component
Offers to reload when a new version of the app has been downloaded in the background.
Until the player accepts, the version they're playing keeps working, offline too.
-->
<script lang="ts">
  import { useRegisterSW } from 'virtual:pwa-register/svelte';
  import { strings } from '../../i18n';
  import { onTop } from '../lib/top-layer';
  import { DURATION, fly } from '../lib/motion';

  // `needRefresh` is a Svelte store: `$needRefresh` reads its current value.
  const { needRefresh, updateServiceWorker } = useRegisterSW();
</script>

{#if $needRefresh}
  <div
    class="toast"
    role="status"
    popover="manual"
    {@attach onTop}
    transition:fly={{ y: 24, duration: DURATION.slow }}
  >
    <span>{strings.updateReady}</span>
    <button onclick={() => updateServiceWorker(true)}>{strings.update}</button>
  </div>
{/if}

<style>
  /* A popover (see onTop), with the browser's popover styles undone. */
  .toast {
    position: fixed;
    inset: auto;
    margin: 0;
    border: none;
    color: inherit;
    overflow: visible;
    top: max(var(--space-3), env(safe-area-inset-top));
    left: 50%;
    translate: -50%;
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-2) var(--space-2) var(--space-4);
    border-radius: var(--radius-full);
    background: var(--color-surface);
    box-shadow: var(--shadow-md);
    white-space: nowrap;
  }

  button {
    min-height: 36px;
    padding: 0 var(--space-4);
    border: none;
    border-radius: var(--radius-full);
    background: var(--color-accent);
    color: var(--color-accent-contrast);
    font: inherit;
    font-weight: var(--weight-bold);
    cursor: pointer;
  }
</style>
