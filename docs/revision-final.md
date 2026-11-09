# Revisión final del MVP

Revisión del 2 de noviembre de 2026 de la lista de `CLAUDE.md` («Cuando termines, comprueba…»).
Se repite en cualquier momento con:

```bash
npm run check
```

```bash
npm run accesibilidad
```

`npm run accesibilidad` necesita Playwright con Chromium (ver README). GitHub Actions ejecuta las dos en cada pull request.

## 1. Todas las rutas del mapa funcionan

**Correcto.** `npm run check` exige las 15 rutas del MVP y una página por noticia, y comprueba que ningún enlace interno lleva a una página inexistente. `npm run accesibilidad` abre las 19 páginas (15 rutas, 3 noticias y la 404). La construcción en un subdirectorio (`BASE_PATH=/vega-norte-web`, como en GitHub Pages) también pasa sin enlaces rotos.

## 2. Ningún titular supera 6 palabras

**Correcto.** Se cuentan las palabras de todos los H1, H2, H3 y `.titular` del HTML publicado, y del `titulo` de cada fichero de contenido, incluidas las noticias nuevas que cree n8n.
Cambio aplicado al texto: en `cuotas.md`, «Lo que no incluye: el pack de equipación» (8 palabras) pasó a «No incluye: el pack de equipación» (6).

## 3. No hay apellidos de menores

**Correcto.**
- **Búsqueda automática:** `npm run check` busca en `contenido/`, `datos/` y la web publicada parejas «Nombre Apellido» con apellidos frecuentes. Solo se admiten los adultos ficticios de `club.json` (directiva y Delegada) y los patrocinadores.
- **Revisión manual de las noticias:** las tres noticias de ejemplo no nombran a ningún menor ni señalan a nadie por un error, una expulsión o una lesión.
- **Formularios:** solo piden del menor el nombre de pila y el año de nacimiento. El campo del nombre lleva la ayuda «Solo el nombre, sin apellidos».
- **Imágenes:** no hay fotos de personas; solo ilustraciones sin figuras humanas.
- **Límite:** la búsqueda es una heurística. Un apellido poco frecuente no se detecta, así que cada noticia nueva debe seguir revisándose antes de publicarse.

## 4. Contraste y teclado

**Correcto.**
- **axe-core 4.14:** reglas WCAG 2.1 A y AA, contraste incluido, en las 19 páginas a 360 px y a 1280 px. Sin ninguna incidencia.
- **Estilos calculados:**
  - Oswald nunca baja de 14 px y siempre va en mayúsculas;
  - el oro no se usa en ningún texto;
  - verde y ámbar de resultado solo aparecen en marcadores y tablas.
- **Teclado en las 19 páginas:**
  - el primer Tab llega a «Saltar al contenido», que lleva al contenido;
  - todo elemento enfocable es visible y muestra el foco;
  - no hay trampas de foco.
- **Menú móvil:** se abre con Enter y se cierra con Escape.
- **Acordeón:** usa `<details>`, así que se maneja con teclado de forma nativa.
- **Filtros de noticias:** son botones con `aria-pressed`.

## 5. Vista de móvil a 360 px

**Correcto.** Ninguna de las 19 páginas se desplaza en horizontal a 360 px. Las tablas anchas (categorías y cuotas) se desplazan dentro de su marco. Las de pocas columnas (plazas y directiva) caben enteras.

## 6. Los formularios funcionan en modo demostración

**Correcto en los cuatro formularios** (familias, jugadores, entrenadores y contacto):
- **Comportamiento:**
  - se ve el aviso de modo demostración;
  - la casilla de consentimiento empieza sin marcar;
  - un envío vacío muestra errores;
  - un envío válido muestra «Modo demostración» y la carga con `formulario`, `fecha_envio`, `origen_pagina`, `datos` y `consentimientos`;
  - no sale ninguna petición `POST`.
- **Probado a mano en el bloque 5 con un webhook local que imita n8n:**
  - la carga llega en JSON;
  - con respuesta 200 se muestra `respuesta_ok`;
  - con respuesta 500 se muestra `respuesta_error` y se conservan los datos;
  - si el campo trampa está relleno, no se envía nada.

## Corregido durante la revisión

- **Clics perdidos en el formulario:** un campo con error se revalidaba al salir de él, y el mensaje de error, al ocultarse, desplazaba el formulario justo al hacer clic en el campo siguiente o en la casilla, de modo que el clic se perdía. Ahora se revalida mientras se corrige.

## Otras reglas revisadas

- **Colores y fuentes:** solo variables de `tokens.css`, sin degradados (`npm run check`).
- **Sin emojis, sin `<iframe>` y sin recursos externos**, salvo Google Fonts. No se instala ninguna cookie, así que el aviso de cookies sigue desactivado.
- **Ninguna indicación interna** («Se genera…», «Nota interna», «(Fase 2)», `datos/…`) llega a la web.
- **Correos, teléfonos y NIF de los textos** coinciden con `club.json`.
- **Primera persona del plural** en los textos de interfaz añadidos (404, formularios, listado de noticias).
- **No hay ningún `.env` en git.**

## Pendiente de decisión (no lo he decidido yo)

- **Texto público «llegará en la Fase 2»** en `categorias.md`.
- **Columna «Plazas de portero»:** ¿los porteros están incluidos en las plazas o son aparte?
- **Campo `campo`** de la crónica de ejemplo: no está en el esquema de noticias.
- **Forma de los datos de `Partido`** para el módulo de resultados: depende de lo que genere n8n.
- **Paginación del listado de noticias**, cuando haya muchas.
- **Antes de un uso real:** escudo definitivo, logos de patrocinadores, PDF del protocolo, imágenes de las noticias y revisión jurídica de los textos legales.
