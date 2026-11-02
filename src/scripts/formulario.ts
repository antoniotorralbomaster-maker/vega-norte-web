// Lógica en el navegador del formulario genérico (src/components/Formulario.astro).
// Valida, monta la carga para n8n y la envía; o, en modo demostración, solo la muestra.

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RE_TEL = /^\+?[\d\s().-]{9,20}$/;
const TIEMPO_MAXIMO_MS = 15000;

type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

interface Carga {
  formulario: string;
  fecha_envio: string;
  origen_pagina: string;
  datos: Record<string, string | number>;
  consentimientos: Record<string, boolean>;
}

/** Devuelve el mensaje de error de un control o null si es válido. */
function validar(c: Control): string | null {
  if (c instanceof HTMLInputElement && c.type === 'checkbox') {
    return c.required && !c.checked ? 'Para enviar el formulario tienes que marcar esta casilla.' : null;
  }
  const valor = c.value.trim();
  if (!valor) return c.required ? 'Este campo es obligatorio.' : null;

  if (c instanceof HTMLInputElement) {
    if (c.type === 'email' && !RE_EMAIL.test(valor)) return 'Escribe un correo válido, por ejemplo nombre@correo.es.';
    if (c.type === 'tel' && (!RE_TEL.test(valor) || valor.replace(/\D/g, '').length < 9))
      return 'Escribe un teléfono válido, de al menos 9 cifras.';
    if (c.inputMode === 'numeric') {
      const min = Number(c.dataset.min);
      const max = Number(c.dataset.max);
      const n = Number(valor);
      if (!/^\d{4}$/.test(valor) || n < min || n > max) return `Escribe un año entre ${min} y ${max}.`;
    }
  }
  return null;
}

function marcar(c: Control, error: string | null) {
  const caja = document.getElementById(`${c.id}-error`);
  if (error) c.setAttribute('aria-invalid', 'true');
  else c.removeAttribute('aria-invalid');
  if (caja) {
    caja.textContent = error ?? '';
    caja.hidden = !error;
  }
}

function montarCarga(form: HTMLFormElement, controles: Control[]): Carga {
  const datos: Carga['datos'] = {};
  const consentimientos: Carga['consentimientos'] = {};
  for (const c of controles) {
    if (c instanceof HTMLInputElement && c.dataset.consentimiento !== undefined) {
      consentimientos[c.name] = c.checked;
    } else if (c instanceof HTMLInputElement && c.inputMode === 'numeric') {
      datos[c.name] = c.value.trim() ? Number(c.value.trim()) : '';
    } else {
      datos[c.name] = c.value.trim();
    }
  }
  return {
    formulario: form.dataset.formulario ?? '',
    fecha_envio: new Date().toISOString(),
    origen_pagina: location.pathname,
    datos,
    consentimientos,
  };
}

function mostrarRespuesta(form: HTMLFormElement, texto: string, estado: 'ok' | 'error' | 'demo') {
  const caja = form.querySelector<HTMLElement>('.formulario__respuesta');
  if (!caja) return;
  caja.dataset.estado = estado;
  caja.textContent = texto;
  caja.focus();
}

async function enviar(webhook: string, carga: Carga): Promise<boolean> {
  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), TIEMPO_MAXIMO_MS);
  try {
    const r = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(carga),
      signal: control.signal,
    });
    return r.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(temporizador);
  }
}

function iniciar(form: HTMLFormElement) {
  if (form.dataset.iniciado) return;
  form.dataset.iniciado = 'si';

  const boton = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  const resumen = form.querySelector<HTMLElement>('.formulario__resumen')!;
  const trampa = form.querySelector<HTMLInputElement>('input[name="honeypot"]');
  const carga = form.querySelector<HTMLDetailsElement>('.formulario__carga');
  const controles = [...form.querySelectorAll<Control>('.campo input, .campo select, .campo textarea')];
  const webhook = form.dataset.webhook;
  const textoBoton = boton.textContent ?? 'Enviar';

  boton.disabled = false;

  // Al corregir un campo con error, se revalida al salir de él.
  for (const c of controles) {
    const evento = c instanceof HTMLInputElement && c.type === 'checkbox' ? 'change' : 'blur';
    c.addEventListener(evento, () => {
      if (c.getAttribute('aria-invalid') === 'true') marcar(c, validar(c));
    });
  }

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();

    const errores = controles.map((c) => ({ c, error: validar(c) })).filter((x) => x.error);
    for (const c of controles) marcar(c, errores.find((x) => x.c === c)?.error ?? null);

    const lista = resumen.querySelector('ul')!;
    lista.replaceChildren(
      ...errores.map(({ c, error }) => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `#${c.id}`;
        a.textContent = `${c.dataset.etiqueta}: ${error}`;
        a.addEventListener('click', (e) => {
          e.preventDefault();
          c.focus();
        });
        li.append(a);
        return li;
      }),
    );
    resumen.hidden = errores.length === 0;
    if (errores.length) {
      resumen.focus();
      return;
    }

    // Campo trampa relleno: es un robot. Se simula el éxito y no se envía nada.
    if (trampa?.value) {
      mostrarRespuesta(form, form.dataset.respuestaOk ?? '', 'ok');
      form.reset();
      return;
    }

    const datos = montarCarga(form, controles);

    if (!webhook) {
      mostrarRespuesta(form, 'Modo demostración: los datos son correctos, pero no se ha enviado nada.', 'demo');
      if (carga) {
        carga.hidden = false;
        carga.querySelector('pre')!.textContent = JSON.stringify(datos, null, 2);
      }
      return;
    }

    boton.disabled = true;
    boton.textContent = 'Enviando…';
    const ok = await enviar(webhook, datos);
    boton.disabled = false;
    boton.textContent = textoBoton;

    if (ok) {
      form.reset();
      mostrarRespuesta(form, form.dataset.respuestaOk ?? '', 'ok');
    } else {
      mostrarRespuesta(form, form.dataset.respuestaError ?? '', 'error');
    }
  });
}

export function iniciarFormularios() {
  document.querySelectorAll<HTMLFormElement>('form.formulario').forEach(iniciar);
}
