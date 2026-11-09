// Formatos en español de España.

const fechaLarga = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const numero = new Intl.NumberFormat('es-ES');

/** 2026-11-02 → «2 de noviembre de 2026» */
export function fecha(valor: string | Date): string {
  const d = typeof valor === 'string' ? new Date(`${valor}T00:00:00Z`) : valor;
  return fechaLarga.format(d);
}

/** Valor para el atributo datetime de <time> */
export function fechaIso(valor: string | Date): string {
  const d = typeof valor === 'string' ? new Date(`${valor}T00:00:00Z`) : valor;
  return d.toISOString().slice(0, 10);
}

/** 370 → «370 €» (con espacio fino no separable, como en el texto del club) */
export function euros(valor: number): string {
  return `${numero.format(valor)} €`;
}

export function cifra(valor: number): string {
  return numero.format(valor);
}
