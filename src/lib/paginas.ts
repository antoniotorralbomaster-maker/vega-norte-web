import { getCollection } from 'astro:content';
import type { EntradaMenu } from './menu';

/** Mapa slug → título, a partir de contenido/paginas. */
export async function titulosPorRuta(): Promise<Map<string, string>> {
  const paginas = await getCollection('paginas');
  return new Map(paginas.map((p) => [p.data.slug, p.data.titulo]));
}

export function etiqueta(e: EntradaMenu, titulos: Map<string, string>): string {
  return e.etiqueta ?? titulos.get(e.ruta) ?? e.ruta;
}
