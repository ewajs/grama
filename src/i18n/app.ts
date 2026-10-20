/**
 * What the installed app and link previews say, part of the Spanish strings (`es`). Apart,
 * with no imports, because the build config reads it too (vite.config.ts: the manifest,
 * the preview tags), and so does `npm run icons`.
 * @module
 */

/** The app's name, tagline and places, as installs, shortcuts and link previews show them. */
export const app = {
  appName: 'Grama',
  tagline: 'Uní las letras y encontrá todas las palabras.',
  preview:
    'Un juego de palabras con voseo y palabras nuestras: niveles infinitos, desafío del día y Contrarreloj. Gratis y sin publicidad.',
  previewAlt: 'Grama: uní las letras y encontrá todas las palabras.',
  dailyChallenge: 'Desafío del día',
  trial: 'Contrarreloj',
  dictionary: 'Tu diccionario',
  /** What each screenshot in the install dialog shows. */
  installScreenshots: {
    inicio: 'El inicio: tu nivel, el desafío del día, el Contrarreloj y tu diccionario',
    jugando: 'Un nivel: el tablero y la rueda de letras',
    diccionario: 'Tu diccionario: todas las palabras que encontraste',
    contrarreloj: 'Contrarreloj: rueda tras rueda contra el reloj',
    escritorio: 'En la computadora, el tablero y la rueda lado a lado',
  },
};
