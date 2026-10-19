<!--
@component
An on/off switch with its label. Bind it: `<Toggle label="…" bind:checked={…} />`.

- `label`: what it turns on or off.
- `checked`: whether it's on (bindable).
-->
<script lang="ts">
  let { label, checked = $bindable() }: { label: string; checked: boolean } = $props();
</script>

<label>
  <span>{label}</span>
  <input type="checkbox" role="switch" bind:checked />
</label>

<style>
  label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-height: 44px;
    cursor: pointer;
  }

  input {
    appearance: none;
    position: relative;
    width: 48px;
    height: 28px;
    margin: 0;
    border-radius: var(--radius-full);
    background: var(--color-tile-border);
    cursor: pointer;
    transition: background-color var(--dur-fast);
  }

  input::after {
    content: '';
    position: absolute;
    top: 3px;
    left: 3px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--color-surface);
    box-shadow: var(--shadow-sm);
    transition: translate var(--dur-fast) var(--ease-out);
  }

  input:checked {
    background: var(--color-accent);
  }

  input:checked::after {
    translate: 20px;
  }
</style>
