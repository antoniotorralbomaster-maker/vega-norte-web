// Colecciones de contenido. Leen directamente de /contenido, que es la fuente de verdad.
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// El identificador de cada entrada es la ruta del fichero sin extensión
// (p. ej. «club/valores» o «2026-10-31-alevin-a-3-1-las-encinas»), no el campo
// `slug` de la cabecera, que se usa como ruta pública de la página.
const idPorFichero = ({ entry }: { entry: string }) => entry.replace(/\.md$/, '');

// Páginas: cabecera común de contenido/paginas/**/*.md.
const paginas = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './contenido/paginas', generateId: idPorFichero }),
  schema: z
    .object({
      titulo: z.string(),
      slug: z.string(),
      seccion: z.string(),
      bloques: z.array(z.number()),
      fase: z.string(),
      descripcion: z.string().optional(),
      datos: z.array(z.string()).optional(),
      formulario: z.string().optional(),
      publico: z.string().optional(),
      tono: z.string().optional(),
      nota_interna: z.string().optional(),
    })
    .passthrough(),
});

// Noticias: esquema acordado con n8n (CLAUDE.md). No cambiar sin avisar.
const noticias = defineCollection({
  loader: glob({ pattern: '*.md', base: './contenido/noticias', generateId: idPorFichero }),
  schema: z
    .object({
      titulo: z.string(),
      tipo: z.enum(['cronica', 'convocatoria', 'comunicado']),
      fecha: z.coerce.date(),
      categoria: z.string(),
      equipo: z.string().optional(),
      rival: z.string().optional(),
      marcador: z.string().optional(),
      resultado: z.enum(['victoria', 'empate', 'derrota']).optional(),
      ejemplo: z.boolean().optional(),
      imagen: z.object({
        descripcion: z.string(),
        alt: z.string(),
      }),
    })
    .passthrough(),
});

export const collections = { paginas, noticias };
