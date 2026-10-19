/** Player-facing text in Rioplatense Spanish (voseo). */
export const es = {
  appName: 'Grama',
  level: (number: number) => `Nivel ${number}`,
  score: 'Puntos',
  wheel: 'Letras: arrastrá el dedo de una a otra para formar una palabra',
  shuffle: 'Mezclar letras',
  bonus: (count: number) => `Palabras extra: ${count}`,
  levelComplete: '¡Bien ahí!',
  levelCompleteDetail: (level: number) => `Completaste el nivel ${level}`,
  pointsWon: (points: number) => `+${points} puntos`,
  bonusWords: (count: number) => (count === 1 ? '1 palabra extra' : `${count} palabras extra`),
  nextLevel: 'Siguiente nivel',
};

/** The shape every language pack must provide: the same keys as Spanish. */
export type Strings = typeof es;
