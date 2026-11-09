// Punto único de lectura de la ficha de datos. Las páginas y componentes
// importan desde aquí; nunca copian cifras a mano.
import club from '../../datos/club.json';
import formularios from '../../datos/formularios.json';

export { club, formularios };

export type Patrocinador = (typeof club.patrocinadores)[number];

/** Patrocinadores de la franja roja: el principal y, después, colaboradores (máx. 3, según el manual). */
export function patrocinadoresFranja(max = 3): Patrocinador[] {
  const principales = club.patrocinadores.filter((p) => p.nivel === 'Principal');
  const resto = club.patrocinadores.filter((p) => p.nivel !== 'Principal');
  return [...principales, ...resto].slice(0, max);
}
