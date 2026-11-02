# Vega Norte Web · instrucciones para Claude Code

## Contexto
Web de **AD Vega Norte**, club de fútbol base **ficticio** de la zona norte de Madrid, creado para el TFM «Vega Norte Digital» del Máster en IA Generativa (EBIS) de Antonio Torralbo (perfil de negocio) y Jorge Rodríguez (perfil técnico). **La web no será pública**: solo se enseña en la presentación del TFM. Aun así debe parecer real y cuidada, y respetar las reglas de menores como si fuera un club real.

Esta primera fase es **solo la parte estática**: páginas de contenido, diseño y estructura. Debe quedar **preparada** para añadir después, sin rehacer nada:
1. **Formularios** conectados a automatizaciones de n8n (guardan en un repositorio Excel).
2. **Generador de noticias** (n8n añadirá noticias como ficheros nuevos).
3. Publicaciones en redes sociales (no afectan a la web, pero comparten la misma ficha de datos).

## Fuentes de verdad (no copies datos a mano en las páginas)
- `datos/club.json`: cifras, categorías, cuotas, campus, pruebas, plazas, patrocinadores, protección, datos legales, preguntas frecuentes.
- `datos/formularios.json`: campos, textos de consentimiento y variables de entorno de cada formulario.
- `contenido/paginas/**/*.md`: texto de cada página. Cada fichero tiene una cabecera con título, ruta (`slug`), sección, bloque del esquema, fase y descripción. El texto marca con «Se genera desde…» o «Formulario …» los puntos donde va un componente; **esas indicaciones son para ti y no se publican**.
- `contenido/noticias/*.md`: noticias. Los tres ejemplos actuales llevan `ejemplo: true`.
- `diseno/tokens.css`: colores, tipografías y escala del Manual de identidad v1.0. No uses valores fuera de este fichero.

## Propuesta técnica (puedes proponer otra y justificarla)
- Generador de sitios estáticos con contenido en Markdown y JSON (por ejemplo Astro, con colecciones de contenido).
- CSS sencillo basado en `tokens.css`; JavaScript solo donde haga falta (acordeón de preguntas frecuentes, validación de formularios).
- Tipografías Oswald (500, 700) y Source Sans 3 (400, 600) desde Google Fonts. Sin otras fuentes.
- Sitio multipágina, responsive desde 360 px de ancho.
- Nada de servicios externos que instalen cookies (mapas, vídeos o redes incrustados).

## Mapa del sitio (MVP: 20 bloques)
| Ruta | Fichero | Bloques |
|---|---|---|
| `/` | `inicio.md` | 1-6 |
| `/club/quienes-somos` | `club/quienes-somos.md` | 7 |
| `/club/valores` | `club/valores.md` | 8 |
| `/club/proteccion-de-menores` | `club/proteccion-de-menores.md` | 9 |
| `/equipos` | `equipos/categorias.md` | 11 |
| `/ven-a-jugar/familias` | `ven-a-jugar/familias.md` | 13, 17 |
| `/ven-a-jugar/jugadores` | `ven-a-jugar/jugadores.md` | 14, 17 |
| `/ven-a-jugar/cuotas` | `ven-a-jugar/cuotas.md` | 15 |
| `/ven-a-jugar/preguntas-frecuentes` | `ven-a-jugar/preguntas-frecuentes.md` | 16 |
| `/cuerpo-tecnico/unete` | `cuerpo-tecnico/unete.md` | 18 |
| `/noticias` y `/noticias/[slug]` | `noticias.md` + `contenido/noticias/` | 20, 21 |
| `/contacto` | `contacto.md` | 24 |
| `/legal/privacidad`, `/legal/cookies`, `/legal/aviso-legal` | `legal/*.md` | 25 |

**Fase 2 (no construir ahora, pero deja el menú y la estructura listos para añadirlas):** organización y cuerpo técnico (10), ficha de equipo (12), campus (19), resultados y horarios de la jornada (22), patrocinadores (23), metodología por etapas (26), guía para familias (27).

Menú principal: Inicio · El club · Equipos · Ven a jugar · Cuerpo técnico · Noticias · Contacto. Pie: legal, protección de menores, contacto y patrocinadores.

## Reglas obligatorias (Manual de identidad v1.0)
- Colores: solo la paleta de `tokens.css`. Sin azules, neones ni degradados. Proporción orientativa: 60 % blanco o arena, 30 % rojo, 10 % granate y carbón. El oro (≤ 5 %) solo para logros y **nunca para texto**. Los colores de resultado (verde, ámbar, gris) solo en marcadores y tablas.
- Titulares en Oswald, **siempre en mayúsculas** (aplícalo con CSS; el texto del contenido está en minúscula normal), de **máximo 6 palabras**, con +1 % de espaciado. Nunca texto corrido en mayúsculas. Nunca Oswald por debajo de 14 px.
- Texto corrido en Source Sans 3 (18/28 px). Escala web: H1 48/56, H2 32/40, H3 24/32, texto pequeño 14/20.
- Sin emojis en la web.
- La web habla en primera persona del plural.
- Contraste mínimo WCAG 2.1: 4,5:1 en texto normal; 3:1 en texto de 24 px o más.
- Fotos con esquinas de 16 px.
- Escudo: **todavía no está en el repositorio**. Usa un marcador de posición (texto «AD VEGA NORTE» en Oswald 500, granate) y deja un único punto de sustitución para `vega-norte-escudo-*.svg`.
- Imágenes: no uses fotos de personas reales ni de menores. Mientras no haya imágenes propias, usa ilustraciones sencillas en los colores del club. Cada noticia lleva un campo `imagen.descripcion` que más adelante servirá para generar la imagen con IA.

## Reglas de menores (prevalecen sobre el diseño)
- Nunca apellidos de menores en ninguna página, ficha ni dato de ejemplo.
- Nunca un menor en primer plano. Nunca se señala a un menor por un error, expulsión o lesión.
- Los formularios solo piden nombre de pila y año de nacimiento del menor, más los datos del tutor. Casilla de consentimiento obligatoria y sin marcar por defecto.
- Los datos de adultos del club (directiva, Delegada) son ficticios.

## Componentes que debes construir
1. **Cabecera y pie** con menú, lema y patrocinadores (franja inferior en rojo con hasta 3 logos y el lema, según el manual).
2. **Tarjetas «Ven a jugar»** (dos entradas) en portada.
3. **Cifras del club**, **tabla de categorías**, **tabla de cuotas**, **tabla de plazas**, **acordeón de preguntas frecuentes**, **franja de patrocinadores**, **tarjeta de regla de imágenes**: todos leen de `datos/club.json`.
4. **Listado y página de noticia**, con etiqueta de categoría en pastilla granate (Oswald 500, texto blanco), fecha y filtros por tipo.
5. **Formulario genérico** (ver siguiente apartado).
6. **Módulo de resultados** de portada como marcador de posición con aviso.
7. **Aviso de cookies** como componente preparado, desactivado mientras no haya cookies no necesarias (ver `legal/cookies.md`).

## Cómo dejar la web lista para n8n
**Formularios.** Un componente único que construye cada formulario desde `datos/formularios.json`. Al enviar:
- Valida en el navegador (obligatorios, correo, rango del año de nacimiento, casilla de consentimiento, campo trampa `honeypot` vacío).
- Envía un `POST` con JSON a la URL de la variable de entorno indicada en `webhook_env` (por ejemplo `PUBLIC_WEBHOOK_FAMILIAS`). Carga: `{ formulario, fecha_envio, origen_pagina, datos: {...campos}, consentimientos: {...} }`.
- Si la variable no existe, muestra un aviso discreto de «modo demostración» y **no envía nada**. Crea un `.env.example` con las cuatro variables vacías. Nunca subas un `.env` real.
- Muestra `respuesta_ok` o `respuesta_error` sin recargar la página.

**Noticias.** Cada noticia es un fichero `contenido/noticias/AAAA-MM-DD-slug.md` con esta cabecera: `titulo`, `tipo` (`cronica`, `convocatoria` o `comunicado`), `fecha`, `categoria`, `equipo` (opcional), `rival`, `marcador`, `resultado` (`victoria`, `empate`, `derrota`, opcionales), `ejemplo` (opcional), `imagen: { descripcion, alt }`. No cambies este esquema sin avisar: n8n lo usará para crear ficheros nuevos. Un fichero nuevo en `main` debe bastar para publicar una noticia tras reconstruir la web.

**Datos.** Las plazas, cuotas, fechas de pruebas y campus se actualizan editando `datos/club.json`. El esquema de ese fichero tampoco debe cambiar sin avisar.

## Cómo trabajar
- Haz un plan breve y enséñalo antes de programar. Trabaja en ramas y abre un pull request por bloque grande; Antonio y Jorge revisan.
- Escribe un `README.md` con cómo instalar, arrancar y construir la web.
- No inventes datos, nombres ni cifras: todo sale de `datos/` y `contenido/`. Si falta algo, pregunta.
- Cuando termines, comprueba: (1) todas las rutas del mapa funcionan, (2) ningún titular supera 6 palabras, (3) no hay apellidos de menores, (4) contraste y teclado, (5) vista de móvil a 360 px, (6) los formularios funcionan en modo demostración.

## Decisiones pendientes (no las tomes tú)
- Dónde se despliega la web (Netlify, Vercel o GitHub Pages). Para GitHub Pages en repositorios privados, comprobar si exige un plan de pago.
- Guía de estilo posterior: puede cambiar `tokens.css`, así que no codifiques colores ni fuentes en los componentes.
