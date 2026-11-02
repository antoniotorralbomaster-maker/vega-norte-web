import { getCollection, type CollectionEntry } from 'astro:content';

export type Noticia = CollectionEntry<'noticias'>;

/** Noticias de la más reciente a la más antigua (a igual fecha, por nombre de fichero). */
export async function noticiasOrdenadas(): Promise<Noticia[]> {
  const todas = await getCollection('noticias');
  return todas.sort((a, b) => b.data.fecha.getTime() - a.data.fecha.getTime() || b.id.localeCompare(a.id));
}

export const rutaNoticia = (n: Noticia) => `/noticias/${n.id}`;

export const etiquetaNoticia = (n: Noticia) => n.data.equipo ?? n.data.categoria;

export const TIPOS = {
  cronica: { singular: 'Crónica', plural: 'Crónicas', motivo: 'campo' },
  convocatoria: { singular: 'Convocatoria', plural: 'Convocatorias', motivo: 'conos' },
  comunicado: { singular: 'Comunicado', plural: 'Comunicados', motivo: 'balon' },
} as const;
