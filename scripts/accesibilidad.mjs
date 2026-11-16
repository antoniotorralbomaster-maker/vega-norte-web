#!/usr/bin/env node
// Comprobaciones en el navegador (complementan scripts/comprobar.mjs).
// Uso: npm run build && npm run accesibilidad
//
// Para cada página del sitio, a 360 px y a 1280 px:
//  - sin desplazamiento horizontal;
//  - axe-core con las reglas WCAG 2.1 A y AA (incluido el contraste);
//  - estilos calculados: Oswald nunca por debajo de 14 px y siempre en mayúsculas,
//    oro nunca en texto, colores de resultado solo en marcadores y tablas.
// Además: recorrido con teclado (enlace «Saltar al contenido», foco visible,
// sin trampas de foco), menú móvil con teclado y los formularios en modo
// demostración (validan y no envían nada).
//
// Necesita Playwright con Chromium (ver README).
import { spawn } from 'node:child_process';
import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  console.error('Falta Playwright. Instálalo con «npm i --no-save playwright» y «npx playwright install chromium».');
  process.exit(1);
}
const AXE = require.resolve('axe-core/axe.min.js');

const RAIZ = new URL('..', import.meta.url).pathname;
const PUERTO = 4329;
const ORIGEN = `http://localhost:${PUERTO}`;
const ANCHOS = [360, 1280];

if (!existsSync(join(RAIZ, 'dist'))) {
  console.error('No existe dist/. Ejecuta antes «npm run build».');
  process.exit(1);
}

const errores = [];
const error = (regla, msj) => errores.push(`[${regla}] ${msj}`);

const RUTAS = [
  '/',
  '/club/quienes-somos',
  '/club/valores',
  '/club/proteccion-de-menores',
  '/equipos',
  '/ven-a-jugar/familias',
  '/ven-a-jugar/jugadores',
  '/ven-a-jugar/pide-informacion',
  '/ven-a-jugar/cuotas',
  '/ven-a-jugar/preguntas-frecuentes',
  '/cuerpo-tecnico/unete',
  '/noticias',
  '/contacto',
  '/legal/privacidad',
  '/legal/cookies',
  '/legal/aviso-legal',
  '/404',
  ...readdirSync(join(RAIZ, 'dist/noticias'), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => `/noticias/${d.name}`),
];

// Valores RGB de los tokens que tienen restricciones de uso
const ORO = 'rgb(201, 162, 39)';
const RESULTADO = ['rgb(30, 142, 78)', 'rgb(176, 122, 0)'];

// ---------------------------------------------------------------------------
const servidor = spawn('npx', ['astro', 'preview', '--port', String(PUERTO)], { cwd: RAIZ, stdio: 'ignore' });
const parar = () => servidor.kill();
process.on('exit', parar);

async function esperarServidor() {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(ORIGEN)).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('El servidor de vista previa no arranca');
}

async function revisarPagina(pagina, ruta, ancho) {
  const donde = `${ruta} (${ancho} px)`;
  await pagina.goto(ORIGEN + ruta, { waitUntil: 'networkidle' });

  const scroll = await pagina.evaluate(() => document.documentElement.scrollWidth);
  if (scroll > ancho) error('movil', `${donde}: la página mide ${scroll} px de ancho`);

  await pagina.addScriptTag({ path: AXE });
  const resultado = await pagina.evaluate(() =>
    // eslint-disable-next-line no-undef
    axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }),
  );
  for (const v of resultado.violations)
    error('axe', `${donde}: ${v.id} (${v.impact}) en ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(', ')} — ${v.help}`);

  if (ancho !== 1280) return;
  const estilos = await pagina.evaluate(
    ({ ORO, RESULTADO }) => {
      const fallos = [];
      const conTexto = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      for (const el of document.querySelectorAll('body *')) {
        if (!conTexto(el)) continue;
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden' || el.closest('.solo-lectores')) continue;
        const texto = el.textContent.trim().slice(0, 40);
        if (/Oswald/.test(cs.fontFamily)) {
          if (parseFloat(cs.fontSize) < 14) fallos.push(`Oswald a ${cs.fontSize}: «${texto}»`);
          if (cs.textTransform !== 'uppercase' && /\p{L}/u.test(texto)) fallos.push(`Oswald sin mayúsculas: «${texto}»`);
        }
        if (cs.color === ORO) fallos.push(`texto en oro: «${texto}»`);
        if (RESULTADO.includes(cs.color) && !el.closest('.marcador, .resultados, table'))
          fallos.push(`color de resultado fuera de marcador o tabla: «${texto}»`);
      }
      return fallos;
    },
    { ORO, RESULTADO },
  );
  for (const f of estilos) error('estilo', `${donde}: ${f}`);
}

async function revisarTeclado(pagina, ruta) {
  await pagina.goto(ORIGEN + ruta, { waitUntil: 'networkidle' });
  await pagina.keyboard.press('Tab');
  const primero = await pagina.evaluate(() => document.activeElement?.className);
  if (!/saltar/.test(primero ?? '')) error('teclado', `${ruta}: el primer Tab no llega a «Saltar al contenido»`);
  await pagina.keyboard.press('Enter');
  const tras = await pagina.evaluate(() => document.activeElement?.id);
  if (tras !== 'contenido') error('teclado', `${ruta}: «Saltar al contenido» no lleva el foco al contenido`);

  await pagina.goto(ORIGEN + ruta, { waitUntil: 'networkidle' });
  const vistos = new Set();
  for (let i = 0; i < 250; i++) {
    await pagina.keyboard.press('Tab');
    const info = await pagina.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      // Las tarjetas de noticia muestran el foco en la tarjeta (:focus-within)
      const tarjeta = el.closest('.noticia');
      const foco =
        cs.outlineStyle !== 'none' ||
        cs.boxShadow !== 'none' ||
        (tarjeta && getComputedStyle(tarjeta).outlineStyle !== 'none');
      return {
        clave: `${el.tagName}#${el.id}.${el.className}|${el.getAttribute('href') ?? ''}|${el.textContent.trim().slice(0, 30)}`,
        visible: r.width > 0 && r.height > 0,
        foco,
      };
    });
    if (!info) break; // ha recorrido toda la página
    if (vistos.has(info.clave)) break;
    vistos.add(info.clave);
    if (!info.visible) error('teclado', `${ruta}: el foco llega a un elemento invisible (${info.clave})`);
    if (!info.foco) error('teclado', `${ruta}: sin indicador de foco visible en ${info.clave}`);
  }
  if (vistos.size === 0) error('teclado', `${ruta}: no hay ningún elemento enfocable`);
}

async function revisarMenuMovil(navegador) {
  const p = await navegador.newPage({ viewport: { width: 360, height: 800 } });
  await p.goto(ORIGEN + '/', { waitUntil: 'networkidle' });
  await p.focus('.cabecera__abrir');
  await p.keyboard.press('Enter');
  const abierto = await p.getAttribute('.cabecera__abrir', 'aria-expanded');
  const visible = await p.isVisible('#menu-principal a[href$="/contacto"]');
  if (abierto !== 'true' || !visible) error('teclado', 'el menú móvil no se abre con el teclado');
  await p.keyboard.press('Escape');
  if ((await p.getAttribute('.cabecera__abrir', 'aria-expanded')) !== 'false') error('teclado', 'Escape no cierra el menú móvil');
  await p.close();
}

async function revisarFormularios(navegador) {
  const p = await navegador.newPage();
  const envios = [];
  p.on('request', (r) => r.method() === 'POST' && envios.push(r.url()));
  for (const [ruta, id] of [['/ven-a-jugar/pide-informacion', 'familias'], ['/ven-a-jugar/pide-informacion', 'jugadores'], ['/cuerpo-tecnico/unete', null], ['/contacto', null]]) {
    await p.goto(ORIGEN + ruta, { waitUntil: 'networkidle' });
    const form = p.locator(id ? `form.formulario[data-formulario="${id}"]` : 'form.formulario');
    if (await form.getAttribute('data-webhook')) {
      error('formularios', `${ruta}: la construcción tiene un webhook configurado; construye sin .env para probar el modo demostración`);
      continue;
    }
    if (!(await form.locator('[data-demo]').isVisible())) error('formularios', `${ruta}: falta el aviso de modo demostración`);
    if (await form.locator('input[type=checkbox]').first().isChecked()) error('formularios', `${ruta}: la casilla viene marcada`);

    // Vacío: debe mostrar errores
    await form.locator('button[type=submit]').click();
    if (await form.locator('.formulario__resumen').isHidden()) error('formularios', `${ruta}: no valida un envío vacío`);

    // Relleno válido
    for (const c of await form.locator('.campo input, .campo select, .campo textarea').all()) {
      const tipo = await c.evaluate((el) => (el.tagName === 'SELECT' ? 'select' : el.type === 'checkbox' ? 'checkbox' : el.inputMode === 'numeric' ? 'anio' : el.type));
      if (tipo === 'select') await c.selectOption({ index: 1 });
      else if (tipo === 'checkbox') await c.check();
      else if (tipo === 'anio') await c.fill(String(await c.getAttribute('data-min')));
      else if (tipo === 'email') await c.fill('prueba@correo.es');
      else if (tipo === 'tel') await c.fill('600 000 000');
      else await c.fill('Prueba');
    }
    await form.locator('button[type=submit]').click();
    const respuesta = await form.locator('.formulario__respuesta').textContent();
    if (!/Modo demostración/.test(respuesta ?? '')) error('formularios', `${ruta}: un envío válido no muestra el aviso de demostración («${respuesta}»)`);
    const carga = JSON.parse((await form.locator('.formulario__carga pre').textContent()) ?? '{}');
    for (const k of ['formulario', 'fecha_envio', 'origen_pagina', 'datos', 'consentimientos'])
      if (!(k in carga)) error('formularios', `${ruta}: la carga no tiene «${k}»`);
  }
  if (envios.length) error('formularios', `en modo demostración se han enviado ${envios.length} peticiones POST`);
  await p.close();
}

// ---------------------------------------------------------------------------
try {
  await esperarServidor();
  const navegador = await chromium.launch();
  for (const ancho of ANCHOS) {
    const pagina = await navegador.newPage({ viewport: { width: ancho, height: 900 } });
    for (const ruta of RUTAS) await revisarPagina(pagina, ruta, ancho);
    await pagina.close();
  }
  const teclado = await navegador.newPage({ viewport: { width: 1280, height: 900 } });
  for (const ruta of RUTAS) await revisarTeclado(teclado, ruta);
  await teclado.close();
  await revisarMenuMovil(navegador);
  await revisarFormularios(navegador);
  await navegador.close();
} catch (e) {
  error('script', e.message);
} finally {
  parar();
}

console.log(`Revisadas ${RUTAS.length} páginas a ${ANCHOS.join(' y ')} px, teclado, menú móvil y 4 formularios.\n`);
if (errores.length) {
  console.error(`Errores (${errores.length}):\n  ${errores.join('\n  ')}`);
  process.exit(1);
}
console.log('Todo correcto.');
process.exit(0);
