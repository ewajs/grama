/**
 * Every word the player reads, in Rioplatense Spanish.
 * @module
 */

import type { AchievementId } from '../core/achievements';
import type { Tier } from '../core/difficulty';
import type { Place } from '../core/progress';

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
  backHome: 'Volver al inicio',
  trial: 'Contrarreloj',
  trialTagline: 'Rueda tras rueda contra el reloj',
  trialWheel: (number: number) => `Rueda ${number}`,
  timeLeft: 'Tiempo que queda',
  clock: (seconds: number) =>
    `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`,
  pass: 'Pasar',
  passCost: '−10 s',
  timeUp: '¡Tiempo!',
  points: (count: number) => (count === 1 ? '1 punto' : `${count} puntos`),
  wheelsCleared: (count: number) =>
    count === 1 ? '1 rueda completa' : `${count} ruedas completas`,
  wordsFound: (count: number) => (count === 1 ? '1 palabra' : `${count} palabras`),
  newBest: '¡Tu mejor marca!',
  bestRun: (points: number) => `Tu mejor marca: ${points} puntos`,
  playAgain: 'Otra vez',
  bestShort: (points: number) => `Mejor: ${points}`,
  dailyChallenge: 'Desafío del día',
  dailyTitle: (number: number) => `Desafío #${number}`,
  dailyCompleteDetail: (number: number) => `Completaste el desafío #${number}`,
  weekday: (date: string) =>
    ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][
      new Date(`${date}T12:00`).getDay()
    ] ?? '',
  dailyDone: 'Completado',
  streak: (days: number) => `🔥 ${days}`,
  streakFreeze: 'Racha protegida: si un día no jugás, sigue igual',
  share: 'Compartir',
  copied: '¡Copiado!',
  shareText: (daily: {
    number: number;
    weekday: string;
    tier: string;
    stars: number;
    hints: number;
    streak: number;
    url: string;
  }) =>
    [
      `Grama #${daily.number} · ${daily.weekday} · ${daily.tier}`,
      `${'★'.repeat(daily.stars)}${'☆'.repeat(3 - daily.stars)} · ${daily.hints === 1 ? '1 pista' : `${daily.hints} pistas`}${daily.streak > 1 ? ` · 🔥 ${daily.streak}` : ''}`,
      daily.url,
    ].join('\n'),
  achievements: 'Logros',
  statsTitle: 'Estadísticas',
  achievementsCount: (done: number, total: number) => `${done} de ${total}`,
  achievementUnlocked: 'Logro desbloqueado',
  achievementsUnlocked: (done: number, total: number) => `${done} de ${total} desbloqueados`,
  achievementList: {
    firstLevel: ['Primer paso', 'Completá tu primer nivel.'],
    levels10: ['Arrancando', 'Completá 10 niveles.'],
    levels50: ['Constante', 'Completá 50 niveles.'],
    levels100: ['Cien de cien', 'Completá 100 niveles.'],
    threeStars: ['Tres estrellas', 'Ganá 3 estrellas en un nivel.'],
    threeStars10: ['Estrellado', 'Ganá 3 estrellas en 10 niveles.'],
    stars100: ['Cielo lleno', 'Juntá 100 estrellas.'],
    extra: ['Sin miedo', 'Completá un nivel extra difícil.'],
    extra10: ['Duro de roer', 'Completá 10 niveles extra difíciles.'],
    extraNoHints: ['A pulmón', 'Completá un nivel extra difícil sin pistas.'],
    noHints10: ['Por mi cuenta', 'Completá 10 niveles sin pistas.'],
    words100: ['Cien palabras', 'Encontrá 100 palabras del tablero.'],
    words1000: ['Diccionario andante', 'Encontrá 1000 palabras del tablero.'],
    bonus50: ['Curioso', 'Encontrá 50 palabras extra.'],
    bonus500: ['Explorador', 'Encontrá 500 palabras extra.'],
    daily: ['Desafiado', 'Completá un desafío del día.'],
    streak3: ['Racha', 'Completá el desafío 3 días seguidos.'],
    streak7: ['Semana redonda', 'Completá el desafío 7 días seguidos.'],
    streak30: ['Imparable', 'Completá el desafío 30 días seguidos.'],
  } satisfies Record<AchievementId, [string, string]>,
  statLabels: {
    levels: 'Niveles',
    dailies: 'Desafíos',
    bestStreak: 'Mejor racha',
    stars: 'Estrellas',
    threeStars: 'Con 3 estrellas',
    words: 'Palabras',
    bonus: 'Palabras extra',
    hints: 'Pistas usadas',
  },
  replaying: 'Repetición',
  playLevel: (level: number) => `Jugar el nivel ${level}`,
  back: 'Volver al inicio',
  loading: 'Cargando palabras…',
  loadError: 'No pudimos cargar las palabras. Revisá tu conexión y volvé a intentar.',
  level: (number: number) => `Nivel ${number}`,
  score: 'Puntos',
  wheel: 'Letras: arrastrá el dedo de una a otra para formar una palabra',
  shuffle: 'Mezclar letras',
  submitWord: (word: string) => `Probar ${word}`,
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
  hintsWon: (count: number) => (count === 1 ? '+1 pista' : `+${count} pistas`),
  replayPays: 'Ya lo habías completado: no suma puntos',
  starsLabel: (stars: number) => (stars === 1 ? '1 estrella' : `${stars} estrellas`),
  starsHow: '3 estrellas: sin pistas y con 3 palabras extra.',
  recap: 'Las palabras · tocá una para ver qué significa',
  definitionOf: (word: string) => `Qué significa ${word}`,
  definitionHint: 'Mirá qué significa en el diccionario de la Real Academia Española.',
  seeDefinition: 'Ver definición',
  vibration: 'Vibración',
  sound: 'Sonido',
  install: 'Instalar Grama',
  installIos: 'Para instalarla: en Safari tocá Compartir y elegí «Agregar a inicio».',
  themes: { auto: 'Automático', light: 'Claro', dark: 'Oscuro' },
  resetProgress: 'Empezar de cero',
  resetTitle: '¿Empezar de cero?',
  resetDetail: 'Volvés al nivel 1, sin puntos y con 3 pistas. No se puede deshacer.',
  resetConfirm: 'Sí, empezar de cero',
  aboutTitle: 'Acerca de',
  version: (version: string, build: string) => `Versión ${version} · ${build}`,
  checkUpdates: 'Buscar actualizaciones',
  checkingUpdates: 'Buscando…',
  updateChecks: {
    available: 'Hay una versión nueva: tocá Actualizar, arriba.',
    current: 'Ya tenés la última versión.',
    offline: 'No pudimos buscar. Revisá tu conexión.',
    unsupported: 'Las versiones nuevas se buscan solas en la app publicada.',
  },
  whatsNew: 'Novedades',
  news: [
    {
      version: '0.15',
      items: [
        'Escribí las palabras con el teclado, o tocá las letras de a una.',
        'Sonidos suaves (se apagan en el menú).',
        'Arranca más rápido: el inicio aparece enseguida.',
        'Cada 7 días seguidos de desafío, una protección ❄️ para tu racha.',
      ],
    },
    {
      version: '0.14',
      items: [
        'Los desafíos del día ya no se repiten (por lo menos durante meses).',
        'Repetir un nivel ya no suma puntos ni pistas: es para mejorar las estrellas.',
        'Tus estadísticas y logros nunca bajan, y los desafíos también cuentan.',
        'Ventanas más accesibles y colores más legibles.',
      ],
    },
    {
      version: '0.13',
      items: [
        'Todo sobre Grama: una guía con todo lo que querés saber del juego.',
        'Avisos más tranquilos cuando una palabra no vale, es extra o está repetida.',
        'Menú más simple, y esta ventana.',
      ],
    },
    {
      version: '0.12',
      items: [
        'Las letras vuelan al tablero cuando encontrás una palabra.',
        'Confeti y la lista de palabras al completar un nivel.',
        'Tocá una palabra encontrada para ver qué significa.',
      ],
    },
    {
      version: '0.11',
      items: ['Desafío del día, con racha y para compartir.'],
    },
  ],
  creditsTitle: 'Créditos',
  source: 'Código',
  sourceUrl: 'https://github.com/ewajs/grama',
  guide: 'Todo sobre Grama',
  about: 'Acerca de',
  credits:
    'Palabras: diccionario RLA-ES (MPL-2.0) y wordfreq (CC BY-SA 4.0). Letra: Outfit (OFL 1.1).',
  licenses: 'Licencias',
  licensesUrl: 'https://github.com/ewajs/grama/blob/main/NOTICE.md',
  reportTitle: '¿Qué pasó?',
  reportIntro: 'Se abre GitHub con los datos del nivel. Ahí nos contás el resto.',
  reportKinds,
  reportIssueTitle: (kind: keyof typeof reportKinds, place: Place) =>
    `${reportKinds[kind]} (${place.kind === 'daily' ? `desafío del ${place.date}` : `nivel ${place.levelNumber}`})`,
  reportIssueBody: (context: {
    place: Place;
    tier: Tier;
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
      context.place.kind === 'daily'
        ? `Desafío del día: ${context.place.date}`
        : `Nivel: ${context.place.levelNumber} · ${context.place.difficulty} · bloque ${context.place.occurrence}`,
      `Dificultad: ${context.tier}`,
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
