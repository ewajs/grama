<!--
@component
A burst of confetti over the whole screen, in the theme's colors. Skipped for players who
ask for reduced motion.

- `delay`: milliseconds before it bursts.
-->
<script lang="ts">
  import { prefersReducedMotion } from 'svelte/motion';
  import { burst } from '../lib/confetti';

  let { delay = 0 }: { delay?: number } = $props();

  let canvas = $state<HTMLCanvasElement>();

  $effect(() => {
    const target = canvas;
    if (!target || prefersReducedMotion.current) return;
    const style = getComputedStyle(target);
    const colors = ['--color-accent', '--color-bonus', '--color-success', '--color-danger'].map(
      (token) => style.getPropertyValue(token).trim(),
    );
    let stop = () => {};
    const timer = setTimeout(() => (stop = burst(target, colors)), delay);
    // Runs when the component goes away: no confetti left behind.
    return () => {
      clearTimeout(timer);
      stop();
    };
  });
</script>

<canvas bind:this={canvas} aria-hidden="true"></canvas>

<style>
  canvas {
    position: fixed;
    inset: 0;
    z-index: 1;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
</style>
