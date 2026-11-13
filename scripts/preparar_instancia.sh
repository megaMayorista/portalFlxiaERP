#!/usr/bin/env bash
# =====================================================================
#  Prepara la base de UNA instancia del ERP para el portal de descargas.
#
#  Uso:   scripts/preparar_instancia.sh <carpeta_de_la_instancia> <codigo> "<Nombre visible>" [host_jdbc]
#  Ej.:   scripts/preparar_instancia.sh /opt/erp_megamayorista megamayorista "Mega Mayorista"
#  Con INSTANCIAS_YML=config/instancias.yml delante, el bloque se escribe
#  directo en ese archivo (reemplaza el de la misma instancia si ya estaba).
#
#  Qué hace (todo en la base del ERP de esa instancia):
#    1. Crea los índices por identificación del cliente con CONCURRENTLY
#       (no bloquea las ventas mientras se construyen).
#    2. Aplica sql/preparar_erp_para_portal.sql: rol portal_lectura,
#       GRANT por columna, solo lectura y statement_timeout.
#    3. Le da LOGIN al rol con una clave aleatoria NUEVA (cada corrida la
#       rota) y verifica que con ella se puede leer y NO se puede escribir.
#    4. Imprime el bloque listo para pegar en config/instancias.yml.
#
#  No toca ningún dato. Lee CONTAINER_PREFIX, DB_USER, DB_NAME y DB_PORT
#  del .env de la instancia (las mismas variables de su docker compose).
# =====================================================================
set -euo pipefail

CARPETA="${1:?Falta la carpeta de la instancia (ej. /opt/erp_megamayorista)}"
CODIGO="${2:?Falta el codigo de la instancia (ej. megamayorista)}"
NOMBRE="${3:?Falta el nombre visible (ej. \"Mega Mayorista\")}"
HOST_JDBC="${4:-host.docker.internal}"

if ! [[ "$CODIGO" =~ ^[a-z0-9-]{2,30}$ ]]; then
    echo "El codigo solo puede llevar minusculas, numeros y guiones (2 a 30)." >&2
    exit 1
fi

ENV_FILE="$CARPETA/.env"
[ -f "$ENV_FILE" ] || { echo "No existe $ENV_FILE" >&2; exit 1; }

leer() { grep -E "^$1=" "$ENV_FILE" | tail -1 | cut -d= -f2- | tr -d '\r"'"'" ; }
PREFIJO="$(leer CONTAINER_PREFIX || true)"
DB_USER="$(leer DB_USER || true)"
DB_NAME="$(leer DB_NAME || true)"
DB_PORT="$(leer DB_PORT || true)"
for VAR in DB_USER DB_NAME DB_PORT; do
    [ -n "${!VAR}" ] || { echo "Falta $VAR en $ENV_FILE" >&2; exit 1; }
done
CONTENEDOR="${PREFIJO:-erp_}postgres"

AQUI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL="$AQUI/../sql/preparar_erp_para_portal.sql"
[ -f "$SQL" ] || { echo "No encuentro $SQL" >&2; exit 1; }

echo "Instancia: $CODIGO  contenedor=$CONTENEDOR  base=$DB_NAME  usuario=$DB_USER  puerto=$DB_PORT"
docker ps --format '{{.Names}}' | grep -qx "$CONTENEDOR" \
    || { echo "El contenedor $CONTENEDOR no esta corriendo." >&2; exit 1; }

PSQL=(docker exec -i "$CONTENEDOR" psql -v ON_ERROR_STOP=1 -U "$DB_USER" -d "$DB_NAME" -X -q)

echo "1/4 Indices por identificacion (CONCURRENTLY)..."
"${PSQL[@]}" -c "CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_pos_ordenes_cliente_identificacion ON pos.pos_ordenes (ord_cliente_identificacion);"
TIENE_NC="$("${PSQL[@]}" -At -c "SELECT to_regclass('contabilidad.conta_credito') IS NOT NULL")"
if [ "$TIENE_NC" = "t" ]; then
    "${PSQL[@]}" -c "CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_conta_credito_cliente_identificacion ON contabilidad.conta_credito (ccr_cliente_identificacion);"
fi
# Un CONCURRENTLY interrumpido deja el indice INVALIDO: avisar en vez de seguir como si nada.
INVALIDOS="$("${PSQL[@]}" -At -c "SELECT count(*) FROM pg_index i JOIN pg_class c ON c.oid = i.indexrelid WHERE NOT i.indisvalid AND c.relname IN ('ix_pos_ordenes_cliente_identificacion','ix_conta_credito_cliente_identificacion')")"
if [ "$INVALIDOS" != "0" ]; then
    echo "Hay un indice INVALIDO (quedo a medias). Borralo con DROP INDEX CONCURRENTLY y vuelve a correr." >&2
    exit 1
fi

echo "2/4 Rol portal_lectura y permisos por columna..."
"${PSQL[@]}" < "$SQL"

echo "3/4 Clave nueva para portal_lectura..."
# Sin pipe a head: con pipefail, cortar la salida da SIGPIPE en Linux y el
# script moriría solo en el servidor (no se reproduce en Git Bash).
CLAVE="$(openssl rand -hex 16)"
[ "${#CLAVE}" -eq 32 ] || { echo "No se pudo generar la clave." >&2; exit 1; }
"${PSQL[@]}" -c "ALTER ROLE portal_lectura LOGIN PASSWORD '$CLAVE';"

# Comprobacion: con el rol se lee, y escribir esta prohibido.
LEE="$(docker exec -i -e PGPASSWORD="$CLAVE" "$CONTENEDOR" psql -h 127.0.0.1 -U portal_lectura -d "$DB_NAME" -X -At \
        -c "SELECT count(*) FROM pos.pos_ordenes WHERE ord_cliente_identificacion = '0000000000'" 2>&1 || true)"
if ! [[ "$LEE" =~ ^[0-9]+$ ]]; then
    echo "El rol no pudo leer: $LEE" >&2
    exit 1
fi
ESCRIBE="$(docker exec -i -e PGPASSWORD="$CLAVE" "$CONTENEDOR" psql -h 127.0.0.1 -U portal_lectura -d "$DB_NAME" -X -At \
        -c "UPDATE pos.pos_ordenes SET ord_total = ord_total WHERE false" 2>&1 || true)"
if [[ "$ESCRIBE" != *"read-only"* && "$ESCRIBE" != *"permission denied"* && "$ESCRIBE" != *"permiso denegado"* && "$ESCRIBE" != *"solo lectura"* ]]; then
    echo "ATENCION: el rol parece poder escribir: $ESCRIBE" >&2
    exit 1
fi
echo "    Lectura OK, escritura bloqueada."

BLOQUE="    - code: $CODIGO
      name: \"$NOMBRE\"
      jdbc-url: jdbc:postgresql://$HOST_JDBC:$DB_PORT/$DB_NAME
      username: portal_lectura
      password: \"$CLAVE\"
      environments: [2]
      enabled: true"

# Con INSTANCIAS_YML=config/instancias.yml el bloque se escribe directo en el
# archivo (reemplazando el de esa instancia si ya estaba, p. ej. al rotar la
# clave), así la clave no pasa por la pantalla ni por el portapapeles.
if [ -n "${INSTANCIAS_YML:-}" ]; then
    echo "4/4 Escribiendo el bloque de '$CODIGO' en $INSTANCIAS_YML..."
    if [ ! -s "$INSTANCIAS_YML" ]; then
        printf 'portal:\n  instances:\n' > "$INSTANCIAS_YML"
    fi
    TMP="$(mktemp)"
    awk -v code="$CODIGO" '
        /^    - code: / { skip = ($3 == code) }
        !skip { print }
    ' "$INSTANCIAS_YML" > "$TMP"
    printf '%s\n' "$BLOQUE" >> "$TMP"
    cat "$TMP" > "$INSTANCIAS_YML"
    rm -f "$TMP"
    # Solo lo lee el usuario del contenedor del backend (uid 10001, ver backend/Dockerfile).
    chmod 600 "$INSTANCIAS_YML" 2>/dev/null || true
    if [ "$(id -u)" = "0" ]; then chown 10001:10001 "$INSTANCIAS_YML"; fi
    echo "Listo. Aplica con: docker compose restart backend"
else
    echo "4/4 Bloque para config/instancias.yml:"
    printf '\n%s\n\n' "$BLOQUE"
    echo "Pegalo en config/instancias.yml del portal y reinicia: docker compose restart backend"
fi
