import { defineConfig } from 'vitepress';

// "Todo sobre Grama": the guide for players, at /grama/guia/ next to the game (D18).
export default defineConfig({
  lang: 'es-AR',
  title: 'Todo sobre Grama',
  description: 'Cómo se juega Grama, qué palabras valen y cómo se arma cada nivel.',
  base: '/grama/guia/',
  // Built into the game's own output, so it deploys with it.
  outDir: '../dist/guia',
  cleanUrls: true,
  lastUpdated: false,
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/grama/icons/icon.svg' }]],
  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'Todo sobre Grama',
    nav: [{ text: 'Jugar', link: 'https://ewajs.github.io/grama/' }],
    sidebar: [
      {
        text: 'Empezar',
        items: [
          { text: 'Qué es Grama', link: '/' },
          { text: 'Cómo se juega', link: '/como-se-juega' },
        ],
      },
      {
        text: 'Cómo funciona',
        items: [
          { text: 'Qué palabras valen', link: '/palabras' },
          { text: 'Niveles infinitos', link: '/niveles' },
          { text: 'Dificultad', link: '/dificultad' },
          { text: 'Pistas y palabras extra', link: '/pistas' },
        ],
      },
      {
        text: 'Tu progreso',
        items: [
          { text: 'Estrellas, mapa y logros', link: '/progreso' },
          { text: 'Desafío del día', link: '/desafio-del-dia' },
          { text: 'Contrarreloj', link: '/contrarreloj' },
        ],
      },
      {
        text: 'Más',
        items: [{ text: 'Preguntas frecuentes', link: '/preguntas' }],
      },
    ],
    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: 'Buscar', buttonAriaLabel: 'Buscar' },
          modal: {
            noResultsText: 'No encontramos nada para',
            resetButtonTitle: 'Borrar la búsqueda',
            footer: { selectText: 'elegir', navigateText: 'moverse', closeText: 'cerrar' },
          },
        },
      },
    },
    outline: { level: [2, 3], label: 'En esta página' },
    docFooter: { prev: 'Anterior', next: 'Siguiente' },
    darkModeSwitchLabel: 'Tema',
    lightModeSwitchTitle: 'Pasar a tema claro',
    darkModeSwitchTitle: 'Pasar a tema oscuro',
    sidebarMenuLabel: 'Menú',
    returnToTopLabel: 'Volver arriba',
    notFound: {
      title: 'No encontramos esta página',
      quote: 'Capaz que se mezclaron las letras.',
      linkText: 'Volver al inicio',
    },
    footer: {
      message: 'Grama es gratis, sin anuncios y funciona sin conexión.',
    },
  },
});
