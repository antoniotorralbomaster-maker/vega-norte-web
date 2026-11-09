#!/usr/bin/env bash
# Instala la web de AD Vega Norte en el VPS de IONOS, junto a n8n, sin tocar n8n.
# Uso (como root, con el repositorio ya clonado en /root/vega-norte/repo):
#   bash /root/vega-norte/repo/despliegue/ionos/instalar.sh
# Se puede repetir sin problema: no duplica nada y no cambia la contraseña ya creada.

main() {
  set -euo pipefail
  local VN_DIR="${VN_DIR:-/root/vega-norte}"
  local REPO="$VN_DIR/repo"
  local AQUI="$REPO/despliegue/ionos"
  local CONFIG="$VN_DIR/config.env"
  local USUARIO_WEB="${USUARIO_WEB:-TFM}"
  local N8N_ENV="${N8N_ENV:-/root/n8n-compose/.env}"

  paso() { printf '\n\033[1m%s\033[0m\n' "$*"; }
  fallo() { printf '\n\033[1;31mERROR: %s\033[0m\n' "$*" >&2; exit 1; }

  [ "$(id -u)" = 0 ] || fallo "ejecuta este script como root."
  command -v docker >/dev/null || fallo "no encuentro Docker."
  command -v crontab >/dev/null || fallo "no encuentro cron. Instálalo con: apt install -y cron"
  command -v curl >/dev/null || fallo "no encuentro curl. Instálalo con: apt install -y curl"
  command -v flock >/dev/null || fallo "no encuentro flock. Instálalo con: apt install -y util-linux"
  [ -d "$REPO/.git" ] || fallo "no encuentro el repositorio en $REPO."

  paso "1/6 Leyendo la configuración de n8n…"
  local traefik dominio red resolver
  traefik="$(docker ps --filter 'ancestor=traefik:v3' --format '{{.Names}}' | head -1)"
  [ -n "$traefik" ] || traefik="$(docker ps --format '{{.Names}}' | grep -i traefik | head -1 || true)"
  [ -n "$traefik" ] || fallo "no encuentro el contenedor de Traefik que usa n8n."
  red="$(docker inspect -f '{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}' "$traefik" | awk '{print $1}')"
  resolver="$(docker inspect -f '{{join .Args " "}}' "$traefik" | grep -oE 'certificatesresolvers\.[A-Za-z0-9_-]+' | head -1 | cut -d. -f2 || true)"
  dominio="$(grep -E '^N8N_DOMAIN=' "$N8N_ENV" 2>/dev/null | cut -d= -f2- | tr -d '"'"'"' ' || true)"
  [ -n "$dominio" ] || fallo "no encuentro N8N_DOMAIN en $N8N_ENV."
  [ -n "$resolver" ] || resolver="mytlschallenge"
  echo "   Traefik: $traefik · red: $red · certificado: $resolver · dominio: $dominio"

  paso "2/6 Preparando la carpeta $VN_DIR…"
  mkdir -p "$VN_DIR/sitio"
  if [ ! -f "$CONFIG" ]; then
    cat >"$CONFIG" <<CONF
# Configuración de la web de AD Vega Norte en este servidor.
# Tras cambiar algo, ejecuta: bash $AQUI/actualizar.sh --forzar
VN_DIR=$VN_DIR
DOMINIO=$dominio
RUTA_WEB=/vega-norte
RAMA=${RAMA:-main}
RED_TRAEFIK=$red
CERT_RESOLVER=$resolver
CLAVE_DESPLIEGUE=/root/.ssh/vega_norte_deploy

# URLs de los webhooks de n8n. Vacías = modo demostración (no se envía nada).
# Ejemplo: PUBLIC_WEBHOOK_CONTACTO=https://$dominio/webhook/contacto
PUBLIC_WEBHOOK_FAMILIAS=
PUBLIC_WEBHOOK_JUGADORES=
PUBLIC_WEBHOOK_ENTRENADORES=
PUBLIC_WEBHOOK_CONTACTO=
CONF
    chmod 600 "$CONFIG"
    echo "   Creado $CONFIG"
  else
    echo "   Ya existe $CONFIG: se mantiene."
  fi

  paso "3/6 Contraseña de la web (usuario: $USUARIO_WEB)…"
  if [ -s "$VN_DIR/htpasswd" ]; then
    echo "   Ya hay una contraseña creada: se mantiene."
    echo "   Para cambiarla: borra $VN_DIR/htpasswd y vuelve a ejecutar este script."
  else
    echo "   Escribe la contraseña que quieres para entrar en la web y pulsa Enter."
    echo "   Te la pedirá dos veces. Mientras escribes no se ve nada: es normal."
    docker run --rm -it -v "$VN_DIR:/w" httpd:2.4-alpine htpasswd -B -c /w/htpasswd "$USUARIO_WEB" ||
      fallo "no se ha podido crear la contraseña (¿no coincidían las dos?). Vuelve a ejecutar el script."
    chmod 644 "$VN_DIR/htpasswd"
  fi

  paso "4/6 Construyendo la web (la primera vez tarda unos minutos)…"
  VN_DIR="$VN_DIR" bash "$AQUI/actualizar.sh" --forzar

  paso "5/6 Arrancando la web junto a n8n…"
  docker compose -f "$AQUI/compose.yaml" --env-file "$CONFIG" up -d --remove-orphans

  paso "6/6 Programando la actualización automática (cada 10 minutos)…"
  local linea="*/10 * * * * VN_DIR=$VN_DIR bash $AQUI/actualizar.sh >> $VN_DIR/actualizar.log 2>&1"
  { crontab -l 2>/dev/null | grep -v 'despliegue/ionos/actualizar.sh' || true; echo "$linea"; } | crontab -
  echo "   Hecho."

  local ruta
  ruta="$(grep -E '^RUTA_WEB=' "$CONFIG" | cut -d= -f2)"
  local codigo_web codigo_n8n
  codigo_web="$(curl -sk --noproxy "$dominio" -o /dev/null -w '%{http_code}' --retry 5 --retry-delay 2 --retry-all-errors "https://$dominio$ruta/" || true)"
  codigo_n8n="$(curl -sk --noproxy "$dominio" -o /dev/null -w '%{http_code}' "https://$dominio/" || true)"
  echo
  if [ "$codigo_web" = 401 ]; then
    printf '\033[1;32mLISTO.\033[0m La web está en: https://%s%s/\n' "$dominio" "$ruta"
    echo "Usuario: $USUARIO_WEB · Contraseña: la que acabas de escribir."
  else
    echo "AVISO: la web ha respondido con el código «$codigo_web» (se esperaba 401, que pide contraseña)."
    echo "Espera un minuto y abre https://$dominio$ruta/ en el navegador."
  fi
  echo "n8n sigue respondiendo con el código «$codigo_n8n»."
}

main "$@"
exit
