// Lectura de las páginas escritas «por bloques» (como inicio.md).
// Cada bloque empieza con «## Nombre (bloque N)» y sus textos van entre «comillas
// latinas». Las indicaciones que no van entre comillas son notas para quien
// programa y no se publican. Si el texto no tiene el formato esperado, la
// construcción falla con un mensaje claro, en vez de publicar algo a medias.

export interface Seccion {
  bloque: number;
  /** Título del bloque sin «(bloque N)» ni la aclaración tras los dos puntos */
  titulo: string;
  cuerpo: string;
}

export function seccionesPorBloque(markdown: string): Map<number, Seccion> {
  const mapa = new Map<number, Seccion>();
  const partes = markdown.split(/^## /m).slice(1);
  for (const parte of partes) {
    const [cabecera, ...resto] = parte.split('\n');
    const m = cabecera.match(/^(.*?)\s*\(bloque (\d+)\)\s*$/);
    if (!m) continue;
    const titulo = m[1].split(':')[0].trim();
    mapa.set(Number(m[2]), { bloque: Number(m[2]), titulo, cuerpo: resto.join('\n').trim() });
  }
  return mapa;
}

export function bloque(mapa: Map<number, Seccion>, n: number, fichero: string): Seccion {
  const s = mapa.get(n);
  if (!s) throw new Error(`${fichero}: falta la sección «(bloque ${n})»`);
  return s;
}

/** Valor de un campo en negrita: «**Entradilla:** texto» → «texto». */
export function campo(texto: string, nombre: string, fichero: string): string {
  const m = texto.match(new RegExp(`\\*\\*${nombre}:\\*\\*\\s*(.+)`));
  if (!m) throw new Error(`${fichero}: falta el campo «${nombre}»`);
  return m[1].trim();
}

/** Texto entre comillas tras una etiqueta: «Titular: «…»» → «…». */
export function cita(texto: string, etiqueta: string, fichero: string): string {
  const m = texto.match(new RegExp(`${etiqueta}:\\s*«([^»]+)»`, 'i'));
  if (!m) throw new Error(`${fichero}: falta «${etiqueta}: «…»»`);
  return m[1].trim();
}

export interface Enlace {
  texto: string;
  ruta: string;
}

/** Enlaces escritos como «Texto» → /ruta. */
export function enlaces(texto: string): Enlace[] {
  return [...texto.matchAll(/«([^»]+)»\s*→\s*(\/[^\s.,)]*)/g)].map((m) => ({ texto: m[1], ruta: m[2] }));
}

/** Elementos de una lista Markdown («- …»). */
export function lista(texto: string): string[] {
  return [...texto.matchAll(/^- (.+)$/gm)].map((m) => m[1].trim());
}

/** Sustituye `ruta.en.json` por su valor en el objeto de datos. */
export function conDatos(texto: string, datos: Record<string, unknown>, fichero: string): string {
  return texto.replace(/`([\w.]+)`/g, (_, ruta: string) => {
    const valor = ruta.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], datos);
    if (valor === undefined) throw new Error(`${fichero}: \`${ruta}\` no existe en datos/club.json`);
    return String(valor);
  });
}
