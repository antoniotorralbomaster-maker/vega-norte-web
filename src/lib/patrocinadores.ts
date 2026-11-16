// Logos e imágenes de los patrocinadores (src/assets/patrocinadores, ver LEEME.md).
// El nombre de fichero sale del patrocinador de datos/club.json: lo que va antes del « · »,
// sin tildes, en minúscula y con guiones.
import type { ImageMetadata } from 'astro';

const ficheros = import.meta.glob<{ default: ImageMetadata }>('../assets/patrocinadores/*.{png,webp}', { eager: true });

export function slugDe(nombre: string): string {
  return nombre
    .split('·')[0]
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export type TipoImagen = 'logo' | 'logo-blanco' | 'imagen';

/** Imagen del patrocinador, o undefined si todavía no existe el fichero. */
export function imagenPatrocinador(nombre: string, tipo: TipoImagen): ImageMetadata | undefined {
  const base = `/${slugDe(nombre)}-${tipo}.`;
  const entrada = Object.entries(ficheros).find(([ruta]) => ruta.includes(base));
  return entrada?.[1].default;
}
