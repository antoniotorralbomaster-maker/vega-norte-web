// Configuración de Astro para la web de AD Vega Norte.
// SITE_URL y BASE_PATH permiten desplegar en cualquier alojamiento
// (Netlify, Vercel o GitHub Pages en un subdirectorio) sin tocar el código.
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: process.env.SITE_URL || 'http://localhost:4321',
  base: process.env.BASE_PATH || '/',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
});
