-- =====================================================================
--  Lado ERP del portal de descargas (portal.flxia.net)
-- ---------------------------------------------------------------------
--  Se aplica a la base de CADA instancia del ERP (megamayorista, cci,
--  smartdu, shihay, igoma, anturios...). Es idempotente: se puede correr
--  las veces que haga falta.
--
--  1. Rol portal_lectura (NOLOGIN aquí; la clave y el LOGIN se ponen por
--     instancia con scripts/preparar_instancia.sh, nunca en un archivo).
--  2. SELECT SOLO sobre las columnas que el portal usa. Nada de la tabla
--     completa: de pos_configuracion, por ejemplo, ve el RUC y la razón
--     social, jamás el certificado .p12 ni su clave.
--  3. Índices por identificación del cliente (no existían).
--
--  Este mismo bloque va al final de docker/postgres/init_erp.sql de cada
--  repo del ERP (regla: todo el SQL vive en los init). En una base viva de
--  producción los índices se crean con CONCURRENTLY desde el script, que no
--  puede ir dentro de este archivo porque CONCURRENTLY no corre en una
--  transacción ni en un bloque DO.
-- =====================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'portal_lectura') THEN
        CREATE ROLE portal_lectura NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION;
    END IF;
END $$;

-- Aunque alguien le diera más permisos por error, sus transacciones nacen de
-- solo lectura y ninguna consulta pasa de 10 segundos.
ALTER ROLE portal_lectura SET default_transaction_read_only = on;
ALTER ROLE portal_lectura SET statement_timeout = '10s';
ALTER ROLE portal_lectura CONNECTION LIMIT 10;

DO $$
BEGIN
    EXECUTE format('GRANT CONNECT ON DATABASE %I TO portal_lectura', current_database());
END $$;

GRANT USAGE ON SCHEMA pos TO portal_lectura;

-- Facturas
GRANT SELECT (ord_id, pem_id, ord_mascara, ord_numero_completo, ord_clave_acceso,
              ord_cliente_identificacion, ord_cliente_nombre, ord_cliente_email,
              ord_fecha_emision, ord_total, ord_activo, ord_ambiente_sri)
    ON pos.pos_ordenes TO portal_lectura;

GRANT SELECT (cse_id, cse_ord_id, cse_clave_acceso, cse_numero_autorizacion,
              cse_fecha_autorizacion, cse_estado, cse_ride_pdf, cse_xml_autorizado)
    ON pos.pos_comprobantes_sri TO portal_lectura;

-- Emisor (RUC y razón social) de cada comprobante
GRANT SELECT (pem_id, cfg_id) ON pos.pos_puntos_emision TO portal_lectura;
GRANT SELECT (cfg_id, cfg_ruc, cfg_razon_social, cfg_nombre_comercial)
    ON pos.pos_configuracion TO portal_lectura;

CREATE INDEX IF NOT EXISTS ix_pos_ordenes_cliente_identificacion
    ON pos.pos_ordenes (ord_cliente_identificacion);

-- Notas de crédito de venta (solo si la instancia ya tiene contabilidad)
DO $$
BEGIN
    IF to_regclass('contabilidad.conta_credito') IS NOT NULL THEN
        EXECUTE 'GRANT USAGE ON SCHEMA contabilidad TO portal_lectura';
        EXECUTE 'GRANT SELECT (ccr_id, cfg_id, ccr_numero_completo, ccr_clave_acceso,
                               ccr_numero_autorizacion, ccr_fecha_emision, ccr_fecha_autorizacion,
                               ccr_ambiente_sri, ccr_cliente_identificacion, ccr_cliente_nombre,
                               ccr_cliente_email, ccr_total, ccr_estado_sri, ccr_activo,
                               ccr_eliminada, ccr_ride_pdf, ccr_xml_autorizado)
                 ON contabilidad.conta_credito TO portal_lectura';
        EXECUTE 'CREATE INDEX IF NOT EXISTS ix_conta_credito_cliente_identificacion
                 ON contabilidad.conta_credito (ccr_cliente_identificacion)';
    END IF;
END $$;
