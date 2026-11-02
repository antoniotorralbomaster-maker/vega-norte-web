// Especificación de formularios (datos/formularios.json) y URL de cada webhook de n8n.
import { formularios as spec } from './datos';

export type Formulario = (typeof spec.formularios)[number];
export type Campo = Formulario['campos'][number] & {
  min?: number;
  max?: number;
  opciones?: string[];
};

export const respuestas = { ok: spec.respuesta_ok, error: spec.respuesta_error };

export function formulario(id: string): Formulario {
  const f = spec.formularios.find((x) => x.id === id);
  if (!f) throw new Error(`El formulario «${id}» no existe en datos/formularios.json`);
  return f;
}

/**
 * URL del webhook leída en la construcción desde la variable `webhook_env`
 * (p. ej. PUBLIC_WEBHOOK_FAMILIAS, en .env o en el entorno del alojamiento).
 * Si no existe o está vacía, el formulario funciona en modo demostración.
 */
export function webhookDe(f: Formulario): string | undefined {
  const valor = (import.meta.env as Record<string, string | undefined>)[f.webhook_env]?.trim();
  if (!valor) return undefined;
  if (!/^https:\/\//.test(valor) && !/^http:\/\/localhost/.test(valor))
    throw new Error(`${f.webhook_env} debe ser una URL https (valor actual: «${valor}»)`);
  return valor;
}
