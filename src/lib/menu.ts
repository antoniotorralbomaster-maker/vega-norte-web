// Estructura de navegación del sitio. Única fuente del menú principal y del pie.
//
// - Las rutas MVP toman su etiqueta del `titulo` de su fichero en contenido/paginas
//   (se resuelve en Cabecera.astro), salvo que se indique `etiqueta`.
// - Las rutas de fase 2 ya están colocadas con `fase: 2`: no se muestran hasta
//   cambiar FASE_ACTIVA o marcar la entrada con `fase: 1` cuando exista su página.
//   Las rutas de fase 2 son una propuesta y pueden cambiar.

export const FASE_ACTIVA = 1;

export interface EntradaMenu {
  /** Ruta sin base, p. ej. /club/valores */
  ruta: string;
  /** Texto fijo; si falta, se usa el `titulo` de la página con ese slug. */
  etiqueta?: string;
  /** 1 = MVP, 2 = fase 2 (oculta) */
  fase: 1 | 2;
  /** Bloque del esquema, como referencia. */
  bloque?: number;
  hijos?: EntradaMenu[];
}

export const menuPrincipal: EntradaMenu[] = [
  { ruta: '/', etiqueta: 'Inicio', fase: 1 },
  {
    ruta: '/club/quienes-somos',
    etiqueta: 'El club',
    fase: 1,
    hijos: [
      { ruta: '/club/quienes-somos', fase: 1, bloque: 7 },
      { ruta: '/club/valores', fase: 1, bloque: 8 },
      { ruta: '/club/proteccion-de-menores', fase: 1, bloque: 9 },
      { ruta: '/club/organizacion', etiqueta: 'Organización', fase: 2, bloque: 10 },
      { ruta: '/club/metodologia', etiqueta: 'Metodología', fase: 2, bloque: 26 },
      { ruta: '/club/patrocinadores', etiqueta: 'Patrocinadores', fase: 2, bloque: 23 },
    ],
  },
  { ruta: '/equipos', etiqueta: 'Equipos', fase: 1 },
  {
    ruta: '/ven-a-jugar/familias',
    etiqueta: 'Ven a jugar',
    fase: 1,
    hijos: [
      { ruta: '/ven-a-jugar/familias', fase: 1, bloque: 13 },
      { ruta: '/ven-a-jugar/jugadores', fase: 1, bloque: 14 },
      { ruta: '/ven-a-jugar/pide-informacion', fase: 1, bloque: 17 },
      { ruta: '/ven-a-jugar/cuotas', fase: 1, bloque: 15 },
      { ruta: '/ven-a-jugar/preguntas-frecuentes', fase: 1, bloque: 16 },
      { ruta: '/ven-a-jugar/campus', etiqueta: 'Campus', fase: 2, bloque: 19 },
      { ruta: '/ven-a-jugar/guia-para-familias', etiqueta: 'Guía para familias', fase: 2, bloque: 27 },
    ],
  },
  { ruta: '/cuerpo-tecnico/unete', etiqueta: 'Cuerpo técnico', fase: 1 },
  {
    ruta: '/noticias',
    etiqueta: 'Noticias',
    fase: 1,
    hijos: [
      { ruta: '/noticias', fase: 1, bloque: 20 },
      { ruta: '/resultados', etiqueta: 'Resultados y horarios', fase: 2, bloque: 22 },
    ],
  },
  { ruta: '/contacto', etiqueta: 'Contacto', fase: 1 },
];

/** Enlaces del pie: legal, protección de menores y contacto. */
export const menuPie: EntradaMenu[] = [
  { ruta: '/club/proteccion-de-menores', fase: 1 },
  { ruta: '/contacto', etiqueta: 'Contacto', fase: 1 },
  { ruta: '/legal/aviso-legal', fase: 1 },
  { ruta: '/legal/privacidad', fase: 1 },
  { ruta: '/legal/cookies', fase: 1 },
  { ruta: '/club/patrocinadores', etiqueta: 'Patrocinadores', fase: 2 },
];

export const visible = (e: EntradaMenu) => e.fase <= FASE_ACTIVA;

/** Submenús con una sola entrada visible se muestran como enlace simple. */
export function hijosVisibles(e: EntradaMenu): EntradaMenu[] {
  const h = (e.hijos ?? []).filter(visible);
  return h.length > 1 ? h : [];
}
