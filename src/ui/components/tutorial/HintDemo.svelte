<!--
@component
Tutorial animation: the bonus counter's ring fills, a hint is earned, and it reveals a
letter on the board. Loops.
-->
<script lang="ts">
  const CIRCUMFERENCE = 2 * Math.PI * 22;
</script>

<div class="demo" aria-hidden="true">
  <div class="controls">
    <div class="counter">
      <svg viewBox="0 0 48 48">
        <circle class="track" cx="24" cy="24" r="22" />
        <circle
          class="progress"
          cx="24"
          cy="24"
          r="22"
          stroke-dasharray={CIRCUMFERENCE}
          style:--length={CIRCUMFERENCE}
        />
      </svg>
      <span>+5</span>
    </div>
    <span class="arrow">→</span>
    <div class="bulb">
      <svg viewBox="0 0 24 24">
        <path
          d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z"
        />
      </svg>
      <b class="badge before">1</b>
      <b class="badge after">2</b>
    </div>
  </div>
  <div class="row">
    <div class="tile"><span class="hinted">C</span></div>
    <div class="tile"></div>
    <div class="tile"></div>
    <div class="tile"></div>
  </div>
</div>

<style>
  .demo {
    --cycle: 3.6s;
    display: grid;
    justify-items: center;
    gap: var(--space-6);
    padding: var(--space-4) 0;
  }

  .controls {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    color: var(--color-text-muted);
  }

  .counter,
  .bulb {
    position: relative;
    display: grid;
    place-items: center;
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: var(--color-surface);
    box-shadow: var(--shadow-sm);
    color: var(--color-bonus-strong);
    font-weight: var(--weight-bold);
  }

  .counter svg {
    position: absolute;
    inset: 0;
    rotate: -90deg;
    fill: none;
    stroke-width: 3;
  }

  .track {
    stroke: var(--color-tile-border);
  }

  .progress {
    stroke: var(--color-bonus);
    stroke-linecap: round;
    animation: fill var(--cycle) infinite;
  }

  .bulb svg {
    width: 26px;
    height: 26px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .badge {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 20px;
    height: 20px;
    border-radius: var(--radius-full);
    background: var(--color-accent);
    color: var(--color-accent-contrast);
    font-size: 12px;
    line-height: 20px;
    text-align: center;
  }

  .before {
    animation: before var(--cycle) infinite;
  }

  .after {
    animation: after var(--cycle) infinite;
  }

  .row {
    display: flex;
    gap: 6px;
  }

  .tile {
    position: relative;
    width: 40px;
    height: 40px;
    border: 1px solid var(--color-tile-border);
    border-radius: 7px;
    background: var(--color-tile);
  }

  .hinted {
    position: absolute;
    inset: -1px;
    display: grid;
    place-items: center;
    border-radius: inherit;
    box-shadow: inset 0 0 0 2px var(--color-accent);
    color: var(--color-accent-strong);
    font-size: 22px;
    font-weight: var(--weight-bold);
    animation: reveal var(--cycle) infinite;
  }

  /* The ring fills in five steps (five bonus words), then a hint is earned and spent. */
  @keyframes fill {
    0% {
      stroke-dashoffset: var(--length);
      animation-timing-function: steps(5, end);
    }
    50% {
      stroke-dashoffset: 0;
    }
    55%,
    100% {
      stroke-dashoffset: var(--length);
    }
  }

  @keyframes before {
    0%,
    52% {
      opacity: 1;
    }
    53%,
    100% {
      opacity: 0;
    }
  }

  @keyframes after {
    0%,
    52% {
      opacity: 0;
      scale: 0.3;
    }
    58%,
    100% {
      opacity: 1;
      scale: 1;
    }
  }

  @keyframes reveal {
    0%,
    68% {
      opacity: 0;
      scale: 0.4;
    }
    74%,
    94% {
      opacity: 1;
      scale: 1;
    }
    100% {
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    * {
      animation: none !important;
    }
  }
</style>
