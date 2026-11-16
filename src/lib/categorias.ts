// Reglas sobre las categorías de datos/club.json.
import { club } from './datos';

export type Categoria = (typeof club.categorias)[number];

/**
 * Público de cada categoría, según los textos de contenido/paginas/ven-a-jugar:
 * familias.md: Prebenjamín, Benjamín y Alevín.
 * jugadores.md: Infantil, Cadete y Juvenil.
 */
const JUGADORES = new Set(['infantil', 'cadete', 'juvenil']);

export type Publico = 'familias' | 'jugadores';

export function publicoDe(cat: Pick<Categoria, 'id'>): Publico {
  return JUGADORES.has(cat.id) ? 'jugadores' : 'familias';
}

export const rutaPublico: Record<Publico, string> = {
  familias: '/ven-a-jugar/familias',
  jugadores: '/ven-a-jugar/jugadores',
};

/** Nombres de categoría (tal como aparecen en plazas_ejemplo) de un público. */
export function nombresDe(publico: Publico): string[] {
  return club.categorias.filter((c) => publicoDe(c) === publico).map((c) => c.nombre);
}

export interface FilaCuota {
  categoria: string;
  equipos: string;
  mensualidad: number;
  pagos: number;
  total: number;
}

/** Una fila por categoría y nivel de equipo (la cuota depende del equipo). Total = matrícula + mensualidades. */
export function filasCuotas(): FilaCuota[] {
  const { matricula } = club.cuotas;
  return club.categorias.flatMap((c) =>
    c.niveles.map((n) => ({
      categoria: c.nombre,
      equipos: n.equipos,
      mensualidad: n.mensualidad,
      pagos: n.pagos,
      total: matricula + n.mensualidad * n.pagos,
    })),
  );
}

/** «Prebenjamín y Benjamín», «A, B y C» */
export function unirNombres(nombres: string[]): string {
  return nombres.length < 2 ? (nombres[0] ?? '') : `${nombres.slice(0, -1).join(', ')} y ${nombres.at(-1)}`;
}
