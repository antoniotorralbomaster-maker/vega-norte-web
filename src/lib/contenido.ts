// Convierte el cuerpo de una página de contenido/paginas en una lista de trozos:
// Markdown que se publica tal cual y componentes que sustituyen a las
// indicaciones para quien programa («Se genera desde…», «Formulario …», etc.).
//
// Reglas:
// - Las indicaciones conocidas se sustituyen por su componente (ver INDICACIONES).
// - «(Nota interna…)», «Esta página es evergreen…» y las líneas «---» no se publican.
// - Las frases marcadas con «(Fase 2)» no se publican hasta que exista esa página.
// - Si queda un párrafo que parece una indicación (menciona `datos/…`, «Se genera»
//   o «leída de»), la construcción falla: así nunca se publica una nota por error.
import { marked } from 'marked';
import { url } from './url';

marked.setOptions({ gfm: true, breaks: true });

export type Componente =
  | { componente: 'tabla-categorias'; nota?: string }
  | { componente: 'tabla-cuotas'; nota?: string }
  | { componente: 'tabla-plazas'; publico: 'familias' | 'jugadores'; pie?: string }
  | { componente: 'tabla-directiva'; pie?: string }
  | { componente: 'valores'; seNota: Record<string, string> }
  | { componente: 'regla-imagenes'; titulo?: string }
  | { componente: 'faq' }
  | { componente: 'resumen-campus' }
  | { componente: 'mapa' }
  | { componente: 'boton-documento'; texto: string }
  | { componente: 'tarjeta'; contenido: string }
  | { componente: 'formulario'; id: string; ayuda?: string };

export type Trozo = { html: string } | Componente;

export interface PaginaInterpretada {
  titular: string;
  entradilla?: string;
  trozos: Trozo[];
}

const citaDe = (texto: string, etiqueta: string) =>
  texto.match(new RegExp(`${etiqueta}:\\s*«([^»]+)»`, 'i'))?.[1].trim();

/** Indicaciones conocidas. `consume` indica cuántos bloques siguientes absorbe (p. ej. la tabla de ejemplo). */
const INDICACIONES: {
  patron: RegExp;
  crear: (bloque: string, siguiente?: string) => { trozo: Componente; consume?: number } | null;
}[] = [
  {
    patron: /^Se genera desde `categorias`/,
    crear: () => ({ trozo: { componente: 'tabla-categorias' } }),
  },
  {
    patron: /^Tabla desde `categorias`/,
    // La tabla Markdown que sigue es solo un ejemplo: la sustituye el componente.
    crear: (_, sig) => ({ trozo: { componente: 'tabla-cuotas' }, consume: sig?.startsWith('|') ? 1 : 0 }),
  },
  {
    patron: /^Tabla de `plazas_ejemplo`/,
    crear: (b) => ({
      trozo: {
        componente: 'tabla-plazas',
        publico: /Infantil|13 a 18/.test(b.split(':')[0]) ? 'jugadores' : 'familias',
        pie: citaDe(b, 'Pie'),
      },
    }),
  },
  {
    patron: /^Tabla con cargo y nombre, leída de `directiva`/,
    crear: (b) => ({ trozo: { componente: 'tabla-directiva', pie: citaDe(b, 'Pie') } }),
  },
  {
    patron: /^Cuatro tarjetas, leídas de `club\.valores`/,
    // La lista que sigue aporta la frase «Se nota en…» de cada valor.
    crear: (_, sig) => {
      const seNota: Record<string, string> = {};
      for (const [, nombre, resto] of (sig ?? '').matchAll(/^\d+\.\s+\*\*([^*.]+)\.?\*\*(.*)$/gm)) {
        const frase = resto.match(/Se nota[^]*$/)?.[0].trim();
        if (frase) seNota[nombre.trim()] = frase;
      }
      return { trozo: { componente: 'valores', seNota }, consume: sig && /^\d+\./.test(sig) ? 1 : 0 };
    },
  },
  {
    patron: /^Seis reglas, leídas de `proteccion\.reglas_imagen`/,
    crear: (b) => ({ trozo: { componente: 'regla-imagenes', titulo: citaDe(b, 'el título') ?? b.match(/título «([^»]+)»/)?.[1] } }),
  },
  {
    patron: /^Se genera en formato acordeón/,
    crear: () => ({ trozo: { componente: 'faq' } }),
  },
  {
    patron: /^Resumen con enlace al campus/,
    crear: () => ({ trozo: { componente: 'resumen-campus' } }),
  },
  {
    patron: /^Mapa con la ubicación/,
    crear: () => ({ trozo: { componente: 'mapa' } }),
  },
  {
    patron: /^Botón: «([^»]+)»/,
    crear: (b) => ({ trozo: { componente: 'boton-documento', texto: b.match(/^Botón: «([^»]+)»/)![1] } }),
  },
  {
    patron: /^Al final, una tarjeta: «/,
    crear: (b) => {
      const md = b.match(/una tarjeta: «([\s\S]+)»\.?\s*$/)?.[1];
      return md ? { trozo: { componente: 'tarjeta', contenido: aHtml(md) } } : null;
    },
  },
];

const DESCARTAR = [/^\(Nota interna/, /^Esta página es evergreen/, /^-{3,}$/];
const SOSPECHOSO = /`datos\/|datos\/club\.json|formularios\.json|Se genera|leídas? de `/;

/** Markdown → HTML, con enlaces internos respetando BASE_PATH y tablas con el estilo del club. */
export function aHtml(md: string): string {
  return (marked.parse(md, { async: false }) as string)
    .replace(/href="(\/[^"]*)"/g, (_, ruta) => `href="${url(ruta)}"`)
    .replace(/<table>/g, '<div class="tabla-marco" role="region" tabindex="0" aria-label="Tabla"><table class="tabla">')
    .replace(/<\/table>/g, '</table></div>');
}

/** Quita las frases que remiten a la Fase 2, que aún no existe. */
const sinFase2 = (texto: string) => texto.replace(/(^|\s)[^.!?\n]*\(Fase 2\)[.!?]?/g, '').trim();

export function interpretar(cuerpo: string, fichero: string): PaginaInterpretada {
  const lineas = cuerpo.trim().split('\n');
  const h1 = lineas.findIndex((l) => l.startsWith('# '));
  if (h1 === -1) throw new Error(`${fichero}: falta el titular «# …»`);
  const titular = lineas[h1].slice(2).trim();
  const bloques = lineas
    .slice(h1 + 1)
    .join('\n')
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  const trozos: Trozo[] = [];
  let md: string[] = [];
  let entradilla: string | undefined;
  const volcar = () => {
    if (md.length) trozos.push({ html: aHtml(md.join('\n\n')) });
    md = [];
  };

  // El primer párrafo tras el titular es la entradilla (si es texto normal).
  if (bloques[0] && !/^(#|[-|*\d]|Se genera|Tabla|Formulario)/.test(bloques[0])) {
    entradilla = aHtml(bloques.shift()!);
  }

  for (let i = 0; i < bloques.length; i++) {
    const bloque = bloques[i];
    if (DESCARTAR.some((p) => p.test(bloque))) continue;

    // Nota al pie de la tabla anterior
    const nota = bloque.match(/^Nota al pie:\s*«([^»]+)»\.?$/);
    if (nota) {
      const previo = trozos.at(-1);
      if (!previo || !('componente' in previo)) throw new Error(`${fichero}: «Nota al pie» sin tabla delante`);
      (previo as { nota?: string }).nota = nota[1];
      continue;
    }

    // Formulario `id` (ver `datos/formularios.json`). Resto del párrafo: texto para el público.
    const form = bloque.match(/^Formulario `([\w-]+)` \(ver `datos\/formularios\.json`\)\.?\s*([\s\S]*)$/);
    if (form) {
      const [, id, resto] = form;
      const ayuda = citaDe(resto, 'Texto de ayuda sobre el consentimiento');
      if (!ayuda && resto.trim()) md.push(resto.trim());
      volcar();
      trozos.push({ componente: 'formulario', id, ayuda });
      continue;
    }

    const indicacion = INDICACIONES.find((x) => x.patron.test(bloque));
    if (indicacion) {
      const r = indicacion.crear(bloque, bloques[i + 1]);
      if (!r) throw new Error(`${fichero}: no se ha podido interpretar «${bloque.slice(0, 60)}…»`);
      volcar();
      trozos.push(r.trozo);
      i += r.consume ?? 0;
      continue;
    }

    const limpio = sinFase2(bloque);
    if (!limpio) continue;
    if (SOSPECHOSO.test(limpio))
      throw new Error(`${fichero}: este párrafo parece una indicación interna y no sé qué componente poner:\n«${limpio}»`);
    md.push(limpio);
  }
  volcar();
  return { titular, entradilla, trozos };
}
