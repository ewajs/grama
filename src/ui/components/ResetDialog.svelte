<!--
@component
Confirms before wiping the player's progress.

- `onconfirm()`: yes, start over.
- `onclose()`: cancelled.
-->
<script lang="ts">
  import { strings } from '../../i18n';
  import Dialog from './Dialog.svelte';

  let { onconfirm, onclose }: { onconfirm: () => void; onclose: () => void } = $props();
</script>

<Dialog title={strings.resetTitle} {onclose}>
  <p>{strings.resetDetail}</p>
  <button class="primary danger" onclick={onconfirm}>{strings.resetConfirm}</button>
  <button class="secondary" onclick={onclose}>{strings.cancel}</button>
</Dialog>

<style>
  p {
    margin: 0 0 var(--space-2);
    color: var(--color-text-muted);
  }

  .danger {
    background: var(--color-danger);
  }
</style>
