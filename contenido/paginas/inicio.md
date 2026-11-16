---
titulo: "Crecemos juntos, jugamos juntos"
slug: /
seccion: Inicio
bloques: [1, 2, 3, 4, 5, 6]
fase: MVP
descripcion: "AD Vega Norte, la cantera de la zona norte de Madrid. 38 equipos y un sitio para cada nivel."
datos: [club, categorias, patrocinadores]
---

## Cabecera (bloque 1)

**Titular:** Crecemos juntos, jugamos juntos

**Entradilla:** AD Vega Norte es la cantera de la zona norte de Madrid. Tenemos 38 equipos y un sitio para cada nivel, del primer día en el campo a la categoría juvenil.

**Botones:** «Ven a jugar» (lleva al bloque siguiente) y «Únete al cuerpo técnico» (lleva a /cuerpo-tecnico/unete).

## Ven a jugar: dos entradas (bloque 2)

Dos tarjetas de la misma altura, con tono distinto según el manual:

**Tarjeta 1: Familias.** Titular: «Tu hijo o hija, con nosotros». Texto: «Tiene entre 6 y 11 años y quiere empezar o cambiar de club. Te explicamos cómo trabajamos y organizamos una prueba.» Botón: «Quiero información» → /ven-a-jugar/familias

**Tarjeta 2: Jugadores.** Titular: «Tu nivel, tu equipo». Texto: «Tienes entre 12 y 18 años y buscas competir. Consulta las plazas de cada categoría y pide una prueba.» Botón: «Quiero hacer una prueba» → /ven-a-jugar/jugadores

## Cifras del club (bloque 3)

Cuatro cifras que se leen de `datos/club.json`:
- `club.equipos` equipos
- unos `club.jugadores_aprox` jugadores
- 6 etapas, de Prebenjamín a Juvenil
- Desde `club.fundacion`

Pie: «Cada equipo cuenta, del primero al último.»

## Últimas noticias (bloque 4)

Las tres noticias más recientes de `contenido/noticias/`, con su fecha, categoría y titular. Enlace «Ver todas las noticias» → /noticias

## Partidos del fin de semana (bloque 5)

Módulo preparado para recibir resultados y horarios. En esta fase muestra un aviso discreto: «Los resultados y horarios de la jornada se publican aquí cada semana.» Se alimentará más adelante desde el repositorio de resultados (automatización n8n).

## Patrocinadores (bloque 6)

Franja con los patrocinadores de `datos/club.json` (NORTESOL primero) y enlace «Hazte patrocinador» → /contacto
