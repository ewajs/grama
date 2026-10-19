<!--
@component
Tutorial animation: a finger drags across a small wheel to spell SOL, the word shows in
the pill, then goes in. Loops. Pure CSS: every part runs the same 3.2 s cycle.
-->
<svg viewBox="0 0 220 250" aria-hidden="true">
  <g class="pill">
    <rect x="70" y="0" width="80" height="34" rx="17" />
    <text x="110" y="23"
      ><tspan class="p1">S</tspan><tspan class="p2">O</tspan><tspan class="p3">L</tspan></text
    >
  </g>
  <circle class="wheel" cx="110" cy="140" r="100" />
  <path class="line" d="M110 74 L167 107 L167 173" pathLength="100" />
  <g class="letters">
    <circle class="hit h1" cx="110" cy="74" r="20" />
    <circle class="hit h2" cx="167" cy="107" r="20" />
    <circle class="hit h3" cx="167" cy="173" r="20" />
    <text x="110" y="81">S</text>
    <text x="167" y="114">O</text>
    <text x="167" y="180">L</text>
    <text x="110" y="213">A</text>
    <text x="53" y="180">C</text>
    <text x="53" y="114">M</text>
  </g>
  <circle class="finger" r="13" />
</svg>

<style>
  svg {
    width: 100%;
    max-width: 220px;
    --cycle: 3.2s;
  }

  .wheel {
    fill: var(--color-tile);
    stroke: var(--color-tile-border);
  }

  .letters text,
  .pill text {
    font-family: var(--font-sans);
    font-size: 22px;
    font-weight: 700;
    text-anchor: middle;
  }

  .letters text {
    fill: var(--color-text);
  }

  .hit {
    fill: var(--color-accent);
    opacity: 0;
    animation: var(--cycle) infinite;
  }

  .h1 {
    animation-name: on-from-10;
  }
  .h2 {
    animation-name: on-from-35;
  }
  .h3 {
    animation-name: on-from-60;
  }

  .line {
    fill: none;
    stroke: var(--color-accent);
    stroke-width: 5;
    stroke-linecap: round;
    stroke-linejoin: round;
    opacity: 0.6;
    stroke-dasharray: 100;
    animation: draw var(--cycle) infinite;
  }

  .finger {
    fill: var(--color-text);
    opacity: 0;
    offset-path: path('M110 74 L167 107 L167 173');
    animation: finger var(--cycle) infinite;
  }

  .pill {
    animation: pill var(--cycle) infinite;
  }

  .pill rect {
    fill: var(--color-accent);
    animation: pill-color var(--cycle) infinite;
  }

  .pill text {
    fill: var(--color-accent-contrast);
  }

  .p1 {
    animation: on-from-10 var(--cycle) infinite;
  }
  .p2 {
    animation: on-from-35 var(--cycle) infinite;
  }
  .p3 {
    animation: on-from-60 var(--cycle) infinite;
  }

  @keyframes on-from-10 {
    0%,
    9% {
      opacity: 0;
    }
    10%,
    74% {
      opacity: 1;
    }
    76%,
    100% {
      opacity: 0;
    }
  }

  @keyframes on-from-35 {
    0%,
    34% {
      opacity: 0;
    }
    35%,
    74% {
      opacity: 1;
    }
    76%,
    100% {
      opacity: 0;
    }
  }

  @keyframes on-from-60 {
    0%,
    59% {
      opacity: 0;
    }
    60%,
    74% {
      opacity: 1;
    }
    76%,
    100% {
      opacity: 0;
    }
  }

  @keyframes draw {
    0%,
    10% {
      stroke-dashoffset: 100;
      opacity: 0.6;
    }
    60%,
    74% {
      stroke-dashoffset: 0;
      opacity: 0.6;
    }
    76%,
    100% {
      stroke-dashoffset: 0;
      opacity: 0;
    }
  }

  @keyframes finger {
    0% {
      offset-distance: 0%;
      opacity: 0;
    }
    8%,
    10% {
      offset-distance: 0%;
      opacity: 0.35;
    }
    60%,
    72% {
      offset-distance: 100%;
      opacity: 0.35;
    }
    78%,
    100% {
      offset-distance: 100%;
      opacity: 0;
    }
  }

  /* While spelling the pill shows the letters; on release it turns green and goes up. */
  @keyframes pill {
    0%,
    9% {
      opacity: 0;
      translate: 0 0;
    }
    10%,
    76% {
      opacity: 1;
      translate: 0 0;
    }
    90%,
    100% {
      opacity: 0;
      translate: 0 -14px;
    }
  }

  @keyframes pill-color {
    0%,
    75% {
      fill: var(--color-accent);
    }
    76%,
    100% {
      fill: var(--color-success);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    * {
      animation: none !important;
    }
  }
</style>
