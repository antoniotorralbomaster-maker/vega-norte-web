# vega-norte-web

Web estática de **AD Vega Norte** (club de fútbol base ficticio), caso de estudio del TFM «Vega Norte Digital» (Máster en IA Generativa, EBIS).

Todos los datos, personas y empresas son ficticios. La web no es pública: lleva `noindex` y solo se enseña en la presentación del TFM. Las instrucciones de trabajo para Claude Code están en [`CLAUDE.md`](CLAUDE.md).

## Requisitos

- Node.js 20.3 o superior (recomendado 22).

## Instalar, arrancar y construir

```bash
npm install
```

```bash
npm run dev
```

Abre <http://localhost:4321>. Los cambios en `contenido/`, `datos/` o `src/` se ven al momento.

```bash
npm run build
```

Genera la web estática en `dist/`. Para verla tal y como quedará:

```bash
npm run preview
```

## Comprobaciones

```bash
npm run check
```

Construye la web y ejecuta `scripts/comprobar.mjs`, que revisa:

- que se generan todas las rutas del mapa del sitio y no hay enlaces internos rotos;
- que ningún titular (H1-H3 o `.titular`) ni ningún `titulo` de contenido supera 6 palabras;
- que el código solo usa colores y fuentes de `diseno/tokens.css`, sin degradados ni oro en texto;
- que no hay emojis, `<iframe>` ni recursos externos (salvo Google Fonts);
- que los formularios solo piden nombre de pila y año de nacimiento del menor, y que ninguna casilla viene marcada;
- que ninguna indicación interna («Se genera…», «Nota interna», «(Fase 2)», `datos/…`) llega a la web;
- que los correos, teléfonos y NIF escritos en los textos coinciden con `datos/club.json`;
- que no hay ningún `.env` en git.

Las rutas que aún no se han construido aparecen como avisos. Cuando se construye una ruta, se quita de `RUTAS_PENDIENTES` en el script. GitHub Actions ejecuta lo mismo en cada pull request (`.github/workflows/comprobar.yml`).

## Estructura

| Carpeta | Qué contiene |
|---|---|
| `datos/club.json` | Ficha de datos del club: cifras, categorías, cuotas, plazas, patrocinadores… |
| `datos/formularios.json` | Campos, consentimientos y variable de entorno de cada formulario |
| `contenido/paginas/` | Texto de cada página (Markdown con cabecera) |
| `contenido/noticias/` | Noticias, una por fichero `AAAA-MM-DD-slug.md` |
| `diseno/tokens.css` | Colores, tipografías y escala del Manual de identidad v1.0 |
| `src/content.config.ts` | Esquema de páginas y noticias (el de noticias lo usa n8n: no cambiarlo sin avisar) |
| `src/lib/menu.ts` | Menú principal y del pie, con las rutas de fase 2 ya colocadas y ocultas |
| `src/lib/config.ts` | Interruptores del sitio (aviso de cookies) |
| `src/components/` | Cabecera, pie, escudo, aviso de cookies y componentes de datos: cifras, tablas de categorías, cuotas y plazas, acordeón de preguntas, regla de imágenes, patrocinadores, resultados y tarjetas de noticia |
| `src/pages/[...ruta].astro` | Publica cada página de `contenido/paginas` en la ruta de su `slug` |
| `src/lib/contenido.ts` | Sustituye las indicaciones de los textos («Se genera desde…», «Formulario …») por su componente y quita las notas internas; si encuentra una indicación que no conoce, la construcción falla |
| `src/lib/secciones.ts` | Lectura de las páginas escritas por bloques (`inicio.md`): los textos entre «comillas» se publican; el resto son notas internas |
| `src/assets/escudo/` | Punto único de sustitución del escudo (ver su `LEEME.md`) |
| `scripts/comprobar.mjs` | Comprobaciones automáticas |

## Cómo se actualiza

- **Datos** (plazas, cuotas, fechas de pruebas, campus): edita `datos/club.json` y reconstruye.
- **Páginas**: edita el `.md` en `contenido/paginas/`. Una página nueva con cabecera y `slug` se publica sola.
- **Noticias**: añade un fichero en `contenido/noticias/` con la cabecera del esquema y reconstruye.
- **Protocolo de protección**: copia `public/documentos/protocolo-proteccion.pdf`; el botón «Descargar el protocolo» aparece solo cuando el fichero existe.
- **Escudo**: copia `vega-norte-escudo-color.svg` (y opcionalmente `-blanco.svg`) en `src/assets/escudo/`.
- **Fase 2**: cambia `fase: 2` por `fase: 1` en `src/lib/menu.ts` cuando exista la página.

## Despliegue

Pendiente de decidir (Netlify, Vercel o GitHub Pages). La web no depende del alojamiento: basta con publicar `dist/`. Para desplegar en un subdirectorio (GitHub Pages), define estas variables al construir:

```bash
SITE_URL=https://usuario.github.io BASE_PATH=/vega-norte-web npm run build
```
