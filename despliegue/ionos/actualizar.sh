#!/usr/bin/env bash
# Actualiza la web publicada si hay cambios en la rama de GitHub configurada.
# Lo ejecuta cron cada 10 minutos (lo programa instalar.sh). A mano:
#   bash /root/vega-norte/repo/despliegue/ionos/actualizar.sh            (solo si hay cambios)
#   bash /root/vega-norte/repo/despliegue/ionos/actualizar.sh --forzar   (siempre)
#
# Todo va dentro de main(): bash lee la función completa antes de ejecutarla,
# así que no importa que git actualice este mismo fichero mientras corre.

main() {
  set -euo pipefail
  local VN_DIR="${VN_DIR:-/root/vega-norte}"
  local CONFIG="$VN_DIR/config.env"
  [ -f "$CONFIG" ] || { echo "Falta $CONFIG. Ejecuta antes instalar.sh." >&2; exit 1; }
  set -a
  # shellcheck disable=SC1090
  . "$CONFIG"
  set +a

  # Una sola actualización a la vez
  exec 9>"$VN_DIR/.actualizar.lock"
  flock -n 9 || { echo "Ya hay una actualización en marcha."; exit 0; }

  local REPO="$VN_DIR/repo"
  local SITIO="$VN_DIR/sitio"
  cd "$REPO"
  export GIT_SSH_COMMAND="ssh -i ${CLAVE_DESPLIEGUE} -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new -o BatchMode=yes"

  git fetch --quiet origin "$RAMA"
  local nuevo actual
  nuevo="$(git rev-parse "origin/$RAMA")"
  actual="$(cat "$VN_DIR/.publicado" 2>/dev/null || true)"
  if [ "${1:-}" != "--forzar" ]; then
    [ "$nuevo" = "$actual" ] && exit 0
    # Un commit que ya falló no se reintenta cada 10 minutos: espera al siguiente.
    [ "$nuevo" = "$(cat "$VN_DIR/.fallido" 2>/dev/null || true)" ] && exit 0
  fi

  echo "$(date '+%F %T') Publicando ${nuevo:0:7} de la rama $RAMA…"
  git checkout --quiet --force -B "$RAMA" "origin/$RAMA"
  git clean -fdq

  # Variables de los webhooks de n8n (vacías = modo demostración)
  local envs=(-e "SITE_URL=https://$DOMINIO" -e "BASE_PATH=$RUTA_WEB")
  local v
  for v in PUBLIC_WEBHOOK_FAMILIAS PUBLIC_WEBHOOK_JUGADORES PUBLIC_WEBHOOK_ENTRENADORES PUBLIC_WEBHOOK_CONTACTO; do
    envs+=(-e "$v=${!v:-}")
  done

  # Opciones extra de Docker solo para entornos de prueba (p. ej. «--network host»).
  local extra=()
  [ -n "${OPCIONES_CONSTRUCCION:-}" ] && read -ra extra <<<"$OPCIONES_CONSTRUCCION"

  # Se construye dentro de un contenedor de Node: no hay que instalar nada en el servidor.
  docker run --rm -v "$REPO:/app" -w /app "${envs[@]}" ${extra[@]+"${extra[@]}"} "${IMAGEN_NODE:-node:22-slim}" \
    sh -c "npm ci --no-audit --no-fund --loglevel=error && npm run build" >"$VN_DIR/ultima-construccion.log" 2>&1 || {
    echo "$nuevo" >"$VN_DIR/.fallido"
    echo "$(date '+%F %T') ERROR: la construcción de ${nuevo:0:7} ha fallado; la web publicada no cambia. Detalles en $VN_DIR/ultima-construccion.log" >&2
    exit 1
  }

  [ -f "$REPO/dist/index.html" ] || { echo "ERROR: la construcción no ha generado dist/index.html" >&2; exit 1; }

  # Sustituye el contenido publicado (la carpeta se mantiene: nginx la tiene montada)
  mkdir -p "$SITIO"
  find "$SITIO" -mindepth 1 -delete
  cp -a "$REPO/dist/." "$SITIO/"
  echo "$nuevo" >"$VN_DIR/.publicado"
  rm -f "$VN_DIR/.fallido"
  echo "$(date '+%F %T') Publicado ${nuevo:0:7}."
}

main "$@"
exit
