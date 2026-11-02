#!/usr/bin/env node
// Comprobaciones automáticas de las reglas de CLAUDE.md y del Manual de identidad.
// Uso: npm run check (construye y comprueba) o npm run comprobar (solo comprueba dist/).
// Sale con código 1 si hay algún error. Los avisos no hacen fallar.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { execSync } from 'node:child_process';

const RAIZ = new URL('..', import.meta.url).pathname;
const DIST = join(RAIZ, 'dist');
const BASE = (process.env.BASE_PATH || '/').replace(/\/$/, '');

const errores = [];
const avisos = [];
const error = (regla, msj) => errores.push(`[${regla}] ${msj}`);
const aviso = (regla, msj) => avisos.push(`[${regla}] ${msj}`);

function ficheros(dir, exts) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return ficheros(p, exts);
    return exts.includes(extname(n)) ? [p] : [];
  });
}

const rel = (p) => relative(RAIZ, p);
const textoPlano = (html) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, ' ')
    .trim();
// Palabras: se ignoran signos sueltos como «·», «-» o «—».
const palabras = (t) => t.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w));

const MAX_PALABRAS = 6;

// ---------------------------------------------------------------------------
// 1. Rutas del mapa del sitio (MVP)
// ---------------------------------------------------------------------------
const RUTAS_MVP = [
  '/',
  '/club/quienes-somos',
  '/club/valores',
  '/club/proteccion-de-menores',
  '/equipos',
  '/ven-a-jugar/familias',
  '/ven-a-jugar/jugadores',
  '/ven-a-jugar/cuotas',
  '/ven-a-jugar/preguntas-frecuentes',
  '/cuerpo-tecnico/unete',
  '/noticias',
  '/contacto',
  '/legal/privacidad',
  '/legal/cookies',
  '/legal/aviso-legal',
];

// Rutas que se construyen en bloques posteriores. Cada bloque las va quitando de
// esta lista; al terminar el MVP debe quedar vacía y cualquier ruta ausente será error.
const RUTAS_PENDIENTES = new Set([
  '/club/quienes-somos',
  '/club/valores',
  '/club/proteccion-de-menores',
  '/equipos',
  '/ven-a-jugar/familias',
  '/ven-a-jugar/jugadores',
  '/ven-a-jugar/cuotas',
  '/ven-a-jugar/preguntas-frecuentes',
  '/cuerpo-tecnico/unete',
  '/noticias',
  '/contacto',
  '/legal/privacidad',
  '/legal/cookies',
  '/legal/aviso-legal',
]);

const NOTICIAS_PENDIENTES = true; // bloque 4

if (!existsSync(DIST)) {
  console.error('No existe dist/. Ejecuta antes «npm run build» o usa «npm run check».');
  process.exit(1);
}

const htmlDeRuta = (ruta) => join(DIST, ruta === '/' ? 'index.html' : `${ruta.slice(1)}/index.html`);

for (const ruta of RUTAS_MVP) {
  if (existsSync(htmlDeRuta(ruta))) continue;
  if (RUTAS_PENDIENTES.has(ruta)) aviso('rutas', `${ruta} pendiente (se construye en un bloque posterior)`);
  else error('rutas', `${ruta} no se ha generado`);
}

const noticias = ficheros(join(RAIZ, 'contenido/noticias'), ['.md']);
for (const n of noticias) {
  const slug = n.split('/').pop().replace(/\.md$/, '');
  const ruta = `/noticias/${slug}`;
  if (existsSync(htmlDeRuta(ruta))) continue;
  if (NOTICIAS_PENDIENTES) aviso('rutas', `${ruta} pendiente (bloque de noticias)`);
  else error('rutas', `${ruta} no se ha generado`);
}

// Enlaces internos rotos (solo hacia rutas que deberían existir ya)
const paginasHtml = ficheros(DIST, ['.html']);
for (const p of paginasHtml) {
  const html = readFileSync(p, 'utf8');
  for (const [, href] of html.matchAll(/<a\b[^>]*\bhref="([^"#?]+)[^"]*"/g)) {
    if (!href.startsWith('/')) continue;
    let ruta = BASE && href.startsWith(BASE) ? href.slice(BASE.length) : href;
    ruta = ruta.replace(/\/$/, '') || '/';
    if (extname(ruta)) continue;
    if (existsSync(htmlDeRuta(ruta))) continue;
    const pendiente = RUTAS_PENDIENTES.has(ruta) || (NOTICIAS_PENDIENTES && ruta.startsWith('/noticias'));
    if (!pendiente) error('enlaces', `${rel(p)} enlaza a ${href}, que no existe`);
  }
}

// ---------------------------------------------------------------------------
// 2. Titulares de 6 palabras como máximo
// ---------------------------------------------------------------------------
for (const p of paginasHtml) {
  const html = readFileSync(p, 'utf8');
  const titulares = [
    ...[...html.matchAll(/<h([1-3])\b[^>]*>([\s\S]*?)<\/h\1>/g)].map((m) => m[2]),
    ...[...html.matchAll(/<(\w+)\b[^>]*class="[^"]*\btitular\b[^"]*"[^>]*>([\s\S]*?)<\/\1>/g)].map((m) => m[2]),
  ];
  for (const t of titulares) {
    const texto = textoPlano(t);
    const n = palabras(texto).length;
    if (n > MAX_PALABRAS) error('titulares', `${rel(p)}: «${texto}» tiene ${n} palabras`);
  }
}

// Los títulos de las cabeceras de contenido acaban siendo H1 (incluidas noticias nuevas de n8n).
for (const md of ficheros(join(RAIZ, 'contenido'), ['.md'])) {
  const cab = readFileSync(md, 'utf8').match(/^---\n([\s\S]*?)\n---/);
  const titulo = cab?.[1].match(/^titulo:\s*"?(.*?)"?\s*$/m)?.[1];
  if (titulo && palabras(titulo).length > MAX_PALABRAS)
    error('titulares', `${rel(md)}: el título «${titulo}» tiene ${palabras(titulo).length} palabras`);
}

// ---------------------------------------------------------------------------
// 3. Colores y tipografías: solo los de diseno/tokens.css
// ---------------------------------------------------------------------------
const tokens = readFileSync(join(RAIZ, 'diseno/tokens.css'), 'utf8');
const tokensDefinidos = new Set([...tokens.matchAll(/(--vn-[\w-]+)\s*:/g)].map((m) => m[1]));
const fuentes = ficheros(join(RAIZ, 'src'), ['.astro', '.css', '.ts', '.js', '.mjs']);

for (const f of fuentes) {
  const codigo = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const lineas = codigo.split('\n');
  lineas.forEach((linea, i) => {
    const donde = `${rel(f)}:${i + 1}`;
    if (/(^|[\s:(,])#[0-9a-fA-F]{3,8}\b(?![-\w])/.test(linea) && /(color|background|border|fill|stroke|outline|shadow)/i.test(linea))
      error('colores', `${donde}: color escrito a mano; usa una variable de tokens.css`);
    if (/\b(rgba?|hsla?|hwb|lab|lch|oklch)\(/.test(linea)) error('colores', `${donde}: color escrito a mano`);
    if (/gradient\(/.test(linea)) error('colores', `${donde}: degradado (prohibido por el manual)`);
    if (/(^|[^-])color\s*:\s*var\(--vn-oro\)/.test(linea)) error('colores', `${donde}: el oro nunca se usa para texto`);
    if (/font-family\s*:/.test(linea) && !/var\(--vn-fuente-(titulo|texto)\)|inherit/.test(linea))
      error('tipografia', `${donde}: fuente fuera de tokens.css`);
    for (const [, v] of linea.matchAll(/var\((--vn-[\w-]+)/g))
      if (!tokensDefinidos.has(v)) error('colores', `${donde}: ${v} no existe en tokens.css`);
  });
}

// ---------------------------------------------------------------------------
// 4. Sin emojis en la web
// ---------------------------------------------------------------------------
const permitidos = new Set(['©', '®', '™']);
for (const p of paginasHtml) {
  const texto = textoPlano(readFileSync(p, 'utf8').replace(/<(script|style)\b[\s\S]*?<\/\1>/g, ''));
  const emojis = [...texto.matchAll(/\p{Extended_Pictographic}/gu)].map((m) => m[0]).filter((c) => !permitidos.has(c));
  if (emojis.length) error('emojis', `${rel(p)}: ${[...new Set(emojis)].join(' ')}`);
}

// ---------------------------------------------------------------------------
// 5. Sin servicios externos que instalen cookies
// ---------------------------------------------------------------------------
const HOST_PROPIO = new URL(process.env.SITE_URL || 'http://localhost:4321').host;
const HOSTS_PERMITIDOS = ['fonts.googleapis.com', 'fonts.gstatic.com', HOST_PROPIO];
for (const p of paginasHtml) {
  const html = readFileSync(p, 'utf8');
  if (/<iframe\b/i.test(html)) error('externos', `${rel(p)}: contiene un <iframe>`);
  for (const [, src] of html.matchAll(/<(?:script|link|img|source|video|audio)\b[^>]*\b(?:src|href)="(https?:\/\/[^"]+)"/g)) {
    const host = new URL(src).host;
    if (!HOSTS_PERMITIDOS.includes(host)) error('externos', `${rel(p)}: carga un recurso de ${host}`);
  }
}

// ---------------------------------------------------------------------------
// 6. Datos de menores en los formularios: solo nombre de pila y año de nacimiento
// ---------------------------------------------------------------------------
const { formularios } = JSON.parse(readFileSync(join(RAIZ, 'datos/formularios.json'), 'utf8'));
const CAMPOS_MENOR = new Set(['jugador_nombre', 'jugador_nacimiento']);
for (const f of formularios) {
  for (const c of f.campos) {
    if (c.nombre.startsWith('jugador_') && !CAMPOS_MENOR.has(c.nombre))
      error('menores', `formulario ${f.id}: el campo ${c.nombre} pide un dato del menor no permitido`);
    if (/apellido/i.test(c.etiqueta) && c.nombre.startsWith('jugador_'))
      error('menores', `formulario ${f.id}: el campo ${c.nombre} pide apellidos del menor`);
  }
  if (f.consentimientos?.some((c) => c.obligatorio === false && /privacidad/.test(c.nombre)))
    error('menores', `formulario ${f.id}: el consentimiento de privacidad debe ser obligatorio`);
}
for (const p of paginasHtml) {
  const html = readFileSync(p, 'utf8');
  for (const [input] of html.matchAll(/<input\b[^>]*type="checkbox"[^>]*>/g))
    if (/\bchecked\b/.test(input)) error('menores', `${rel(p)}: casilla de consentimiento marcada por defecto`);
}

// ---------------------------------------------------------------------------
// 7. Nunca subir un .env real
// ---------------------------------------------------------------------------
try {
  const seguidos = execSync('git ls-files', { cwd: RAIZ, encoding: 'utf8' }).split('\n');
  for (const f of seguidos) if (/(^|\/)\.env(\.|$)/.test(f) && !f.endsWith('.env.example')) error('secretos', `${f} está en git`);
} catch {
  aviso('secretos', 'no se ha podido consultar git');
}

// ---------------------------------------------------------------------------
console.log(`Comprobadas ${paginasHtml.length} páginas HTML y ${fuentes.length} ficheros de código.\n`);
if (avisos.length) console.log(`Avisos (${avisos.length}):\n  ${avisos.join('\n  ')}\n`);
if (errores.length) {
  console.error(`Errores (${errores.length}):\n  ${errores.join('\n  ')}`);
  process.exit(1);
}
console.log('Todo correcto.');
