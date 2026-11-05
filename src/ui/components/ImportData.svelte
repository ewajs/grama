<!-- @component Local profile file picker and replacement preview. Prop: recorder. Reloads after a successful import. -->
<script lang="ts">
  import type { GramaRecorder } from '../../app/assessment/recorder';
  import {
    MAX_IMPORT_BYTES,
    parseProfileImport,
    type ProfileImport,
  } from '../../app/assessment/import';
  import { strings } from '../../i18n';
  import Dialog from './Dialog.svelte';

  let { recorder }: { recorder: GramaRecorder | null } = $props();
  let input: HTMLInputElement;
  let pending = $state.raw<ProfileImport | null>(null);
  let busy = $state(false);
  let error = $state('');
  async function choose(event: Event & { currentTarget: HTMLInputElement }) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    error = '';
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) {
      error = strings.importTooLarge;
      return;
    }
    busy = true;
    try {
      pending = parseProfileImport(await file.text());
      if (!pending) error = strings.importInvalid;
    } catch {
      error = strings.importInvalid;
    } finally {
      busy = false;
    }
  }
  async function confirm() {
    if (!pending || !recorder || busy) return;
    busy = true;
    if (await recorder.restore(pending)) location.reload();
    else {
      busy = false;
      error = strings.importFailed;
      pending = null;
    }
  }
</script>

<input
  bind:this={input}
  type="file"
  accept=".json,application/json"
  aria-label={strings.importChoose}
  hidden
  onchange={choose}
/>
<button class="secondary" disabled={!recorder || busy} onclick={() => input.click()}
  >{strings.importChoose}</button
>
{#if error}<p role="alert">{error}</p>{/if}
{#if pending}
  <Dialog title={strings.importTitle} onclose={busy ? undefined : () => (pending = null)}>
    <p>{strings.importSummary(pending.summary)}</p>
    <p>{strings.importReplace}</p>
    <p>{strings.importCloseTabs}</p>
    <button class="primary" disabled={busy} onclick={confirm}
      >{busy ? strings.importWorking : strings.importConfirm}</button
    >
    <button class="secondary" disabled={busy} onclick={() => (pending = null)}
      >{strings.cancel}</button
    >
  </Dialog>
{/if}

<style>
  p {
    margin: 0 0 var(--space-2);
    color: var(--color-text-muted);
  }
</style>
