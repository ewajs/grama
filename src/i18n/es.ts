/** Player-facing text in Rioplatense Spanish (voseo). */
export const es = {
  appName: 'Grama',
  level: (number: number) => `Nivel ${number}`,
  score: 'Puntos',
  wheel: 'Letras: arrastrá el dedo de una a otra para formar una palabra',
  shuffle: 'Mezclar letras',
};

/** The shape every language pack must provide: the same keys as Spanish. */
export type Strings = typeof es;
