<script setup lang="ts">
import { computed, ref } from 'vue';
import { NEW_RATING, ratePeriod } from '../../../src/core/assessment/glicko2';
import { PERFORMANCE, performanceMatch } from '../../../src/core/assessment/performance';

const difficulty = ref(2.75),
  hints = ref(0),
  extras = ref(0),
  seconds = ref(80);
const timed = ref(true),
  rating = ref(1500),
  deviation = ref(350);
const match = computed(() =>
  performanceMatch({
    difficulty: difficulty.value,
    targetLetters: 20,
    revealedLetters: hints.value,
    bonusWords: extras.value,
    activeMs: timed.value ? seconds.value * 1000 : null,
  }),
);
const next = computed(() =>
  ratePeriod({ ...NEW_RATING, rating: rating.value, deviation: deviation.value }, [match.value]),
);
// This is the expected-result equation explained on the page; the update itself uses Grama's engine.
const g = 1 / Math.sqrt(1 + (3 * (PERFORMANCE.opponentDeviation / 173.7178) ** 2) / Math.PI ** 2);
const expected = (difference: number) => 1 / (1 + Math.exp((-g * difference) / 173.7178));
const difference = computed(() => rating.value - match.value.opponent.rating);
const expectation = computed(() => expected(difference.value));
const x = (delta: number) => 40 + (delta + 1000) * 0.16;
const y = (score: number) => 150 - score * 120;
const curve = Array.from({ length: 41 }, (_, i) => {
  const delta = -1000 + i * 50;
  return `${x(delta)},${y(expected(delta))}`;
}).join(' ');
const number = (value: number, digits = 2) =>
  value.toLocaleString('es-AR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
</script>

<template>
  <section class="rating-lab" aria-label="Probá el cálculo">
    <p>
      Un tablero hipotético con <strong>20 letras objetivo</strong>. Mové un control por vez: el
      ejemplo vuelve a calcular siempre desde el mismo punto de partida, sin guardar partidas.
    </p>
    <label
      >Dificultad del tablero <output>{{ number(difficulty) }}</output>
      <input
        v-model.number="difficulty"
        aria-label="Dificultad del tablero"
        type="range"
        min="2"
        max="4.5"
        step="0.25"
      />
    </label>
    <label
      >Pistas usadas <output>{{ hints }}</output>
      <input
        v-model.number="hints"
        aria-label="Pistas usadas"
        type="range"
        min="0"
        max="10"
        step="1"
      />
    </label>
    <label
      >Palabras extra <output>{{ extras }}</output>
      <input
        v-model.number="extras"
        aria-label="Palabras extra"
        type="range"
        min="0"
        max="12"
        step="1"
      />
    </label>
    <label class="checkbox"
      ><input v-model="timed" type="checkbox" /> Usar un tiempo confiable</label
    >
    <label
      >Tiempo de resolución
      <output>{{ timed ? `${seconds} segundos` : 'Sin ajuste por tiempo' }}</output>
      <input
        v-model.number="seconds"
        aria-label="Tiempo de resolución"
        type="range"
        min="20"
        max="320"
        step="5"
        :disabled="!timed"
      />
    </label>
    <details>
      <summary>Cambiá tu punto de partida</summary>
      <label
        >Tu nivel anterior <output>{{ rating }}</output>
        <input
          v-model.number="rating"
          aria-label="Tu nivel anterior"
          type="range"
          min="1200"
          max="2000"
          step="50"
        />
      </label>
      <label
        >Incertidumbre anterior (RD) <output>{{ deviation }}</output>
        <input
          v-model.number="deviation"
          aria-label="Incertidumbre anterior"
          type="range"
          min="50"
          max="350"
          step="25"
        />
      </label>
      <p>
        Un RD más bajo significa una estimación más asentada. Probá cómo cambia el tamaño del
        ajuste, manteniendo el mismo resultado.
      </p>
    </details>
    <dl aria-live="polite" aria-atomic="true">
      <div>
        <dt>Nivel del tablero</dt>
        <dd>
          <output aria-label="Nivel del tablero">{{ number(match.opponent.rating, 0) }}</output>
        </dd>
      </div>
      <div>
        <dt>Resultado del tablero (0–1)</dt>
        <dd>
          <output aria-label="Resultado del tablero">{{ number(match.score) }}</output>
        </dd>
      </div>
      <div>
        <dt>Resultado esperado (0–1)</dt>
        <dd>{{ number(expectation) }}</dd>
      </div>
      <div>
        <dt>Nivel después del tablero</dt>
        <dd>
          <output aria-label="Nivel después del tablero">{{ number(next.rating) }}</output>
        </dd>
      </div>
      <div>
        <dt>Nuevo RD</dt>
        <dd>{{ number(next.deviation) }}</dd>
      </div>
    </dl>
    <figure>
      <svg
        viewBox="0 0 400 195"
        role="img"
        :aria-label="`Resultado esperado ${number(expectation)}, resultado obtenido ${number(match.score)}. Diferencia de nivel ${difference}.`"
      >
        <line x1="40" y1="150" x2="360" y2="150" class="axis" />
        <line x1="40" y1="30" x2="40" y2="150" class="axis" />
        <line x1="40" y1="90" x2="360" y2="90" class="grid" />
        <text x="15" y="34">1</text>
        <text x="5" y="94">0,5</text>
        <text x="15" y="154">0</text>
        <text x="40" y="173">−1000</text>
        <text x="195" y="173">0</text>
        <text x="320" y="173">+1000</text>
        <polyline :points="curve" class="curve" />
        <line x1="40" :y1="y(match.score)" x2="360" :y2="y(match.score)" class="outcome" />
        <circle :cx="x(difference)" :cy="y(expectation)" r="4" />
      </svg>
      <figcaption>
        Curva: resultado esperado. Punto: tu situación. Línea de trazos: resultado obtenido. Abajo:
        tu nivel menos el nivel del tablero. Si la línea queda por encima del punto, tu nivel sube.
      </figcaption>
    </figure>
    <p>
      El resultado del tablero está entre 0 y 1;
      <strong>tu nivel de juego no tiene un máximo fijo</strong>. Esta herramienta usa las funciones
      reales de Grama, con la versión {{ PERFORMANCE.version }} del modelo.
    </p>
  </section>
</template>

<style scoped>
.rating-lab {
  padding: 1.25rem;
  margin: 1.5rem 0;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
}
label {
  display: block;
  margin: 1rem 0;
  font-weight: 600;
}
label output {
  float: right;
  font-weight: 400;
}
input[type='range'] {
  display: block;
  width: 100%;
  min-height: 44px;
  accent-color: var(--vp-c-brand-1);
}
.checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 44px;
}
input[type='checkbox'] {
  width: 20px;
  height: 20px;
  accent-color: var(--vp-c-brand-1);
}
summary {
  cursor: pointer;
  min-height: 44px;
  padding: 0.5rem 0;
}
dl {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}
dt {
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
}
dd {
  margin: 0;
  font-size: 1.4rem;
  font-variant-numeric: tabular-nums;
}
figure {
  margin: 1rem 0;
}
svg {
  width: 100%;
  height: auto;
}
text {
  fill: var(--vp-c-text-2);
  font-size: 12px;
}
.axis,
.grid {
  stroke: var(--vp-c-divider);
}
.curve {
  stroke: var(--vp-c-brand-1);
  stroke-width: 2;
  fill: none;
}
.outcome {
  stroke: var(--vp-c-text-1);
  stroke-dasharray: 5 4;
}
circle {
  fill: var(--vp-c-brand-1);
}
figcaption {
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
}
input:focus-visible,
summary:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 3px;
}
@media (max-width: 480px) {
  label output {
    float: none;
    display: block;
  }
}
</style>
