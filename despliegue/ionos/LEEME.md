# Publicar la web en el VPS de IONOS, junto a n8n

La web se publica en **https://DOMINIO-DE-N8N/vega-norte/**, en el mismo servidor y con la misma dirección que n8n, y pide usuario y contraseña. n8n no se modifica: sigue en la raíz del dominio.

## Cómo funciona

- El **Traefik** que ya usa n8n reparte las visitas: lo que empieza por `/vega-norte` va a la web y todo lo demás a n8n. El certificado HTTPS es el mismo.
- La web corre en un contenedor **nginx** aparte (`compose.yaml`), con usuario y contraseña (`nginx.conf.template`).
- `actualizar.sh` descarga la rama `main` de GitHub, construye la web dentro de un contenedor de Node y la publica. Cron lo ejecuta **cada 10 minutos**, pero solo reconstruye si hay cambios. Si una construcción falla (por ejemplo, una noticia con la cabecera mal), la web publicada no cambia y ese commit no se reintenta.
- El servidor descarga el repositorio, que es privado, con una **clave de despliegue de solo lectura**.
- Los formularios envían a n8n en el mismo dominio, así que no hace falta configurar CORS.

Ficheros en el servidor (`/root/vega-norte/`):

| Fichero | Qué es |
|---|---|
| `repo/` | Copia del repositorio |
| `sitio/` | Web publicada |
| `config.env` | Dominio, ruta, rama y URLs de los webhooks |
| `htpasswd` | Usuario y contraseña de la web, cifrados |
| `actualizar.log` | Historial de publicaciones |
| `ultima-construccion.log` | Detalle de la última construcción |

## Instalación (una sola vez)

Todos los comandos se ejecutan en el servidor, conectados por SSH como `root`.

**1. Crear la clave de despliegue y mostrarla:**

```bash
ssh-keygen -t ed25519 -N "" -C "servidor-ionos-vega-norte" -f /root/.ssh/vega_norte_deploy && cat /root/.ssh/vega_norte_deploy.pub
```

**2. Añadirla en GitHub:** repositorio → **Settings → Deploy keys → Add deploy key**. Título: `Servidor IONOS`. Pega la línea que empieza por `ssh-ed25519`. Deja **sin marcar** «Allow write access» y pulsa **Add key**.

**3. Clonar el repositorio:**

```bash
mkdir -p /root/vega-norte && GIT_SSH_COMMAND="ssh -i /root/.ssh/vega_norte_deploy -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new" git clone git@github.com:antoniotorralbomaster-maker/vega-norte-web.git /root/vega-norte/repo
```

**4. Instalar.** Pedirá dos veces la contraseña de la web; no se ve mientras se escribe.

```bash
bash /root/vega-norte/repo/despliegue/ionos/instalar.sh
```

Al terminar muestra `LISTO.` y la dirección de la web. El usuario es `TFM`, en mayúsculas.

## Tareas habituales

**Publicar ya**, sin esperar a los 10 minutos:

```bash
bash /root/vega-norte/repo/despliegue/ionos/actualizar.sh --forzar
```

**Ver el historial de publicaciones:**

```bash
tail -20 /root/vega-norte/actualizar.log
```

**Cambiar la contraseña:**

```bash
rm /root/vega-norte/htpasswd && bash /root/vega-norte/repo/despliegue/ionos/instalar.sh
```

**Conectar los formularios a n8n.** Edita `config.env` con `nano /root/vega-norte/config.env` y rellena, por ejemplo, `PUBLIC_WEBHOOK_CONTACTO=https://DOMINIO-DE-N8N/webhook/contacto` con la «Production URL» del nodo Webhook de n8n. Guarda con `Ctrl + O`, Enter, y sal con `Ctrl + X`. Después:

```bash
bash /root/vega-norte/repo/despliegue/ionos/actualizar.sh --forzar
```

**Quitar la web**, sin afectar a n8n:

```bash
docker compose -f /root/vega-norte/repo/despliegue/ionos/compose.yaml --env-file /root/vega-norte/config.env down && crontab -l | grep -v despliegue/ionos/actualizar.sh | crontab -
```

## Probado

Antes de publicarlo, lo probé en una réplica del servidor: el mismo `compose.yaml` de Traefik de n8n, el mismo nombre de proyecto y de red, y un sustituto de n8n. Comprobé que:

- n8n sigue respondiendo en la raíz y en `/webhook/…`;
- la web pide contraseña (con `tfm` en minúsculas no entra) y redirige HTTP a HTTPS;
- todas las páginas y recursos cargan;
- el formulario funciona en modo demostración;
- una noticia nueva en GitHub se publica sola;
- sin cambios no se reconstruye;
- un commit roto deja la web como estaba y no se reintenta;
- el commit siguiente se publica con normalidad.
