<!-- @component Small rating history chart with a spoken equivalent of every value. Props: values in play order. -->
<script lang="ts">
  import { strings } from '../../i18n';
  let { values }: { values: { label: string; rating: number }[] } = $props();
  const low = $derived(
    Math.floor((Math.min(...values.map((value) => value.rating)) - 25) / 50) * 50,
  );
  const high = $derived(
    Math.ceil((Math.max(...values.map((value) => value.rating)) + 25) / 50) * 50,
  );
  const points = $derived(
    values.map((value, index) => ({
      x: values.length === 1 ? 130 : 12 + (index * 240) / (values.length - 1),
      y: high === low ? 50 : 80 - ((value.rating - low) * 60) / (high - low),
    })),
  );
</script>

<figure>
  <figcaption>{strings.progressChart}</figcaption>
  <svg
    viewBox="0 0 320 100"
    role="img"
    aria-label={values
      .map((value) => strings.progressChartValue(value.label, value.rating))
      .join('; ')}
  >
    <text x="267" y="24" aria-hidden="true">{Math.round(high).toLocaleString('es-AR')}</text>
    <text x="267" y="84" aria-hidden="true">{Math.round(low).toLocaleString('es-AR')}</text>
    <polyline points={points.map((point) => `${point.x},${point.y}`).join(' ')} />
    {#each points as point (point.x)}<circle cx={point.x} cy={point.y} r="3" />{/each}
  </svg>
</figure>

<style>
  figure {
    margin: var(--space-4) 0 0;
  }
  figcaption {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }
  svg {
    display: block;
    width: 100%;
    max-height: 140px;
    overflow: visible;
  }
  polyline {
    fill: none;
    stroke: var(--color-accent-strong);
    stroke-width: 2;
  }
  circle {
    fill: var(--color-accent-strong);
  }
  text {
    fill: var(--color-text-muted);
    font-size: var(--text-sm);
  }
</style>
