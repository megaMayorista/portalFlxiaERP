#!/bin/sh
# =====================================================================
#  Portal de descargas — rol de mínimo privilegio para el backend
# ---------------------------------------------------------------------
#  Corre una sola vez, justo después de init_portal.sql, con el volumen vacío.
#  El backend se conecta como APP_DB_USER: lee y escribe las cuatro tablas
#  del esquema portal, pero no es dueño de nada y no puede ejecutar DDL.
#  Es un script de shell solo porque necesita la clave del entorno; el
#  esquema sigue viviendo entero en init_portal.sql.
# =====================================================================
set -e

: "${APP_DB_USER:?APP_DB_USER es obligatorio}"
: "${APP_DB_PASSWORD:?APP_DB_PASSWORD es obligatorio}"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<EOSQL
CREATE ROLE "${APP_DB_USER}" LOGIN PASSWORD '${APP_DB_PASSWORD}'
    NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION CONNECTION LIMIT 20;

REVOKE ALL ON DATABASE "${POSTGRES_DB}" FROM PUBLIC;
GRANT CONNECT ON DATABASE "${POSTGRES_DB}" TO "${APP_DB_USER}";
REVOKE CREATE ON SCHEMA public FROM PUBLIC;

GRANT USAGE ON SCHEMA portal TO "${APP_DB_USER}";
GRANT SELECT, INSERT, UPDATE, DELETE ON portal.accounts, portal.sessions TO "${APP_DB_USER}";
GRANT SELECT, INSERT, DELETE ON portal.auth_attempts, portal.download_log TO "${APP_DB_USER}";
GRANT USAGE, SELECT ON SEQUENCE portal.accounts_account_id_seq,
                                portal.sessions_session_id_seq,
                                portal.auth_attempts_attempt_id_seq,
                                portal.download_log_download_id_seq TO "${APP_DB_USER}";
EOSQL

echo "Rol de minimo privilegio ${APP_DB_USER} listo."
