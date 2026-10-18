<script lang="ts">
  import { strings } from './i18n';
</script>

<main>
  <h1>{strings.appName}</h1>
  <p>{strings.tagline}</p>
  <span class="badge">{strings.comingSoon}</span>
</main>

<style>
  main {
    display: grid;
    place-content: center;
    justify-items: center;
    gap: var(--space-3);
    min-height: 100dvh;
    padding: var(--space-6);
    text-align: center;
  }

  h1 {
    margin: 0;
    font-size: var(--text-2xl);
    font-weight: var(--weight-bold);
    letter-spacing: 0.04em;
    color: var(--color-accent);
  }

  p {
    margin: 0;
    font-size: var(--text-lg);
    color: var(--color-text-muted);
  }

  .badge {
    margin-top: var(--space-4);
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-full);
    background: var(--color-surface);
    box-shadow: var(--shadow-sm);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
  }
</style>
