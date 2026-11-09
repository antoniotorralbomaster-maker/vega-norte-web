import { getCollection, type CollectionEntry } from 'astro:content';
import type { ImageMetadata } from 'astro';
import { MOSTRAR_NOTICIAS_EJEMPLO } from './config';

export type Noticia = CollectionEntry<'noticias'>;

/** Noticias de la más reciente a la más antigua (a igual fecha, por nombre de fichero). */
export async function noticiasOrdenadas(): Promise<Noticia[]> {
  const todas = await getCollection('noticias', (n) => MOSTRAR_NOTICIAS_EJEMPLO || !n.data.ejemplo);
  return todas.sort((a, b) => b.data.fecha.getTime() - a.data.fecha.getTime() || b.id.localeCompare(a.id));
}

export const rutaNoticia = (n: Noticia) => `/noticias/${n.id}`;

export const etiquetaNoticia = (n: Noticia) => n.data.equipo ?? n.data.categoria;

export const TIPOS = {
  cronica: { singular: 'Crónica', plural: 'Crónicas', motivo: 'campo' },
  convocatoria: { singular: 'Convocatoria', plural: 'Convocatorias', motivo: 'conos' },
  comunicado: { singular: 'Comunicado', plural: 'Comunicados', motivo: 'balon' },
} as const;

// Imágenes propias: src/assets/noticias/<id de la noticia>.(jpg|png|webp). Ver su LEEME.md.
const imagenes = import.meta.glob<{ default: ImageMetadata }>('../assets/noticias/*.{jpg,jpeg,png,webp}', { eager: true });

export function imagenDe(n: Noticia): ImageMetadata | undefined {
  const entrada = Object.entries(imagenes).find(([ruta]) => ruta.split('/').pop()!.replace(/\.\w+$/, '') === n.id);
  return entrada?.[1].default;
}
