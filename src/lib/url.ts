// Construye rutas internas respetando BASE_PATH (necesario si se despliega en un subdirectorio).
const base = import.meta.env.BASE_URL.replace(/\/$/, '');

export function url(ruta: string): string {
  if (/^(https?:|mailto:|tel:|#)/.test(ruta)) return ruta;
  const limpia = ruta.startsWith('/') ? ruta : `/${ruta}`;
  return `${base}${limpia}` || '/';
}

/** Normaliza una ruta para compararla con la actual (sin base ni barra final). */
export function rutaNormalizada(ruta: string): string {
  let r = ruta.startsWith(base) ? ruta.slice(base.length) : ruta;
  r = r.replace(/\/$/, '');
  return r === '' ? '/' : r;
}
