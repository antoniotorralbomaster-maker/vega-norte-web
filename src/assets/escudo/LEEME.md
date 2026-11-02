# Escudo de AD Vega Norte

**Este es el único punto de sustitución del escudo.**

Mientras esta carpeta no tenga ningún SVG, la web muestra un marcador de posición:
el texto «AD VEGA NORTE» en Oswald 500 y en granate (o en blanco sobre fondos de color).

Cuando esté el escudo, copia aquí los ficheros con este nombre:

- `vega-norte-escudo-color.svg`: versión principal, para fondos claros.
- `vega-norte-escudo-blanco.svg`: versión en blanco, para fondos rojo o granate (opcional).

No hace falta tocar código: `src/components/Escudo.astro` los detecta al reconstruir la web.
Si solo hay una versión, se usa en todos los fondos.
