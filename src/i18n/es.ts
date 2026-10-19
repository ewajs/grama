const reportKinds = {
  missing: 'Falta una palabra',
  wrong: 'Palabra rara u ofensiva',
  other: 'Otro problema',
};

const list = (words: readonly string[]) => (words.length > 0 ? words.join(', ') : '—');

/** Player-facing text in Rioplatense Spanish (voseo). */
export const es = {
  appName: 'Grama',
  tagline: 'Uní las letras y encontrá todas las palabras.',
  hintsLeft: 'Pistas',
  continuePlaying: 'Jugar',
  map: 'Mapa',
  mapSummary: (levels: number, stars: number) =>
    `${levels === 1 ? '1 nivel' : `${levels} niveles`} · ${stars} ★`,
  backToMap: 'Volver al mapa',
  replaying: 'Repetición',
  playLevel: (level: number) => `Jugar el nivel ${level}`,
  back: 'Volver al inicio',
  loading: 'Cargando palabras…',
  loadError: 'No pudimos cargar las palabras. Revisá tu conexión y volvé a intentar.',
  level: (number: number) => `Nivel ${number}`,
  score: 'Puntos',
  wheel: 'Letras: arrastrá el dedo de una a otra para formar una palabra',
  shuffle: 'Mezclar letras',
  bonus: (count: number, untilHint: number) =>
    `Palabras extra: ${count}. ${untilHint} más para ganar una pista`,
  hint: (count: number) => (count === 1 ? 'Pista: te queda 1' : `Pista: te quedan ${count}`),
  levelComplete: '¡Bien ahí!',
  levelCompleteDetail: (level: number) => `Completaste el nivel ${level}`,
  pointsWon: (points: number) => `+${points} puntos`,
  bonusWords: (count: number) => (count === 1 ? '1 palabra extra' : `${count} palabras extra`),
  nextLevel: 'Siguiente nivel',
  close: 'Cerrar',
  cancel: 'Cancelar',
  report: 'Reportar un problema',
  menu: 'Menú',
  openMenu: 'Abrir el menú',
  backToGame: 'Volver al juego',
  howToPlay: 'Cómo jugar',
  tutorial: [
    {
      title: 'Uní las letras',
      text: 'Arrastrá el dedo de una letra a otra para formar una palabra. Al soltar, la enviás.',
    },
    {
      title: 'Completá el tablero',
      text: 'Cada fila es una palabra escondida. Encontralas todas para pasar de nivel.',
    },
    {
      title: 'Extras y pistas',
      text: 'Otras palabras válidas suman puntos. Cada 5, ganás una pista que revela una letra.',
    },
  ],
  next: 'Siguiente',
  play: '¡A jugar!',
  skip: 'Saltear',
  theme: 'Tema',
  difficulty: 'Dificultad',
  difficulties: { relaxed: 'Relajada', normal: 'Normal', challenging: 'Desafiante' },
  difficultyNote: 'Se aplica desde el próximo nivel.',
  tiers: { easy: 'Fácil', medium: 'Media', hard: 'Difícil', extra: 'Extra difícil' },
  tierReward: (multiplier: number) => `Puntos ×${multiplier}`,
  extraHint: '+1 pista',
  starsLabel: (stars: number) => (stars === 1 ? '1 estrella' : `${stars} estrellas`),
  starsHow: '3 estrellas: sin pistas y con 3 palabras extra.',
  vibration: 'Vibración',
  install: 'Instalar Grama',
  installIos: 'Para instalarla: en Safari tocá Compartir y elegí «Agregar a inicio».',
  themes: { auto: 'Automático', light: 'Claro', dark: 'Oscuro' },
  resetProgress: 'Empezar de cero',
  resetTitle: '¿Empezar de cero?',
  resetDetail: 'Volvés al nivel 1, sin puntos y con 3 pistas. No se puede deshacer.',
  resetConfirm: 'Sí, empezar de cero',
  about: (build: string) => `Grama · versión ${build}`,
  credits: 'Palabras: diccionario RLA-ES (MPL-2.0) y wordfreq (CC BY-SA 4.0).',
  licenses: 'Licencias',
  licensesUrl: 'https://github.com/ewajs/grama/blob/main/NOTICE.md',
  reportTitle: '¿Qué pasó?',
  reportIntro: 'Se abre GitHub con los datos del nivel. Ahí nos contás el resto.',
  reportKinds,
  reportIssueTitle: (kind: keyof typeof reportKinds, level: number) =>
    `${reportKinds[kind]} (nivel ${level})`,
  reportIssueBody: (context: {
    levelNumber: number;
    letters: readonly string[];
    targets: readonly string[];
    found: readonly string[];
    rejected: readonly string[];
    build: string;
  }) =>
    [
      'Contanos qué pasó (qué palabra, y por qué):',
      '',
      '',
      '---',
      `Nivel: ${context.levelNumber}`,
      `Letras: ${context.letters.join(' ')}`,
      `Palabras del nivel: ${list(context.targets)}`,
      `Encontradas: ${list(context.found)}`,
      `Intentos rechazados: ${list(context.rejected)}`,
      `Versión: ${context.build}`,
    ].join('\n'),
  bonusTitle: 'Palabras extra',
  bonusFoundOf: (found: number, total: number) => `Encontraste ${found} de ${total}`,
  untilHint: (count: number) =>
    count === 1 ? '1 más para una pista' : `${count} más para una pista`,
  bonusNone: 'Todavía ninguna. Probá combinar las letras: cada 5, una pista.',
  updateReady: 'Hay una versión nueva',
  update: 'Actualizar',
};

/** The shape every language pack must provide: the same keys as Spanish. */
export type Strings = typeof es;
