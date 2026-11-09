// Reglas sobre las categorías de datos/club.json.
import { club } from './datos';

export type Categoria = (typeof club.categorias)[number];

/**
 * Público de cada categoría, según los textos de contenido/paginas/ven-a-jugar:
 * familias.md (5 a 12 años): Primeros pasos, Prebenjamín, Benjamín y Alevín.
 * jugadores.md (13 a 18 años): Infantil, Cadete y Juvenil.
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
  categorias: string[];
  edad: string;
  cuota_anual: number;
  pagos: number;
}

/** Agrupa categorías consecutivas con la misma cuota (p. ej. «Prebenjamín y Benjamín»). */
export function filasCuotas(): FilaCuota[] {
  const filas: (FilaCuota & { edades: number[] })[] = [];
  for (const c of club.categorias) {
    const edades = (c.edad.match(/\d+/g) ?? []).map(Number);
    const ultima = filas.at(-1);
    if (ultima && ultima.cuota_anual === c.cuota_anual && ultima.pagos === c.pagos) {
      ultima.categorias.push(c.nombre);
      ultima.edades.push(...edades);
    } else {
      filas.push({ categorias: [c.nombre], edad: '', cuota_anual: c.cuota_anual, pagos: c.pagos, edades });
    }
  }
  return filas.map(({ edades, ...f }) => {
    const min = Math.min(...edades);
    const max = Math.max(...edades);
    return { ...f, edad: min === max ? `${min} años` : `${min}-${max} años` };
  });
}

/** «Prebenjamín y Benjamín», «A, B y C» */
export function unirNombres(nombres: string[]): string {
  return nombres.length < 2 ? (nombres[0] ?? '') : `${nombres.slice(0, -1).join(', ')} y ${nombres.at(-1)}`;
}
