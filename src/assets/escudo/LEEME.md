# Escudo de AD Vega Norte

**Este es el único punto de sustitución del escudo.**

## Qué hay ahora

Los seis SVG de esta carpeta son una **reconstrucción** del escudo «Brote» hecha a partir de la descripción del Manual de identidad v1.0 (escudo partido rojo y blanco, brote de dos hojas, balón en la base y banda «VEGA NORTE · A.D. · 2008»). El paquete original `AD_Vega_Norte_Escudo.zip` no existe, así que no son el archivo oficial. El texto de la banda está convertido a trazados con Oswald 700 y 500 (licencia OFL).

| Fichero | Uso |
|---|---|
| `vega-norte-escudo-completo-principal.svg` | Por defecto, sobre blanco o fondos claros (64 px de alto o más) |
| `vega-norte-escudo-completo-sobre-fondo-rojo.svg` | Sobre rojo, granate o fotos oscuras (pie de página) |
| `vega-norte-escudo-completo-una-tinta.svg` | Blanco y negro, sellos, prensa |
| `vega-norte-escudo-reducido-principal.svg` | Por debajo de 64 px (cabecera, favicon) |
| `vega-norte-escudo-reducido-sobre-fondo-rojo.svg` | Reducido sobre rojo o granate |
| `vega-norte-escudo-reducido-una-tinta.svg` | Reducido en una tinta |

El componente `src/components/Escudo.astro` elige la versión solo: reducida si el alto es menor de 64 px y completa si no.

## Cómo sustituirlo por el oficial

Copia aquí los ficheros del paquete oficial con los mismos nombres (el manual los llama igual) y reconstruye la web. No hay que tocar código.
