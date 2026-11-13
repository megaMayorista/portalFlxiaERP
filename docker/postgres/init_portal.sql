-- =====================================================================
--  Portal de descargas FluxoIA (portal.flxia.net) — base propia
-- ---------------------------------------------------------------------
--  Todo el SQL del portal vive aquí (regla de los proyectos de Cristian:
--  nada de migraciones sueltas). Se ejecuta una sola vez, cuando el
--  volumen está vacío.
--
--  El portal NO guarda comprobantes: los lee en vivo de la base de cada
--  instancia del ERP (rol portal_lectura, ver sql/preparar_erp_para_portal.sql).
--  Aquí solo hay cuentas de clientes, sesiones, intentos y la bitácora de
--  descargas.
--
--  Código y base de datos en inglés; solo los nombres de archivo en español.
-- =====================================================================

SET client_encoding = 'UTF8';
SET timezone = 'America/Guayaquil';

CREATE SCHEMA IF NOT EXISTS portal;

-- ---------------------------------------------------------------------
--  accounts: one per identification (cédula or RUC). There is no sign-up:
--  the account is created the first time the person enters with their
--  identification as user and password, and only if that identification
--  has at least one authorized document in some ERP instance.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS portal.accounts (
    account_id               BIGSERIAL PRIMARY KEY,
    identification           VARCHAR(13)  NOT NULL UNIQUE,
    full_name                VARCHAR(200) NOT NULL,
    password_hash            VARCHAR(100) NOT NULL,
    -- TRUE while the password is still the identification itself (first
    -- entry, or a recovery without e-mail). The portal shows a permanent
    -- "change it" notice; it does not force the change.
    using_default_password   BOOLEAN      NOT NULL DEFAULT TRUE,
    -- Temporary password sent by e-mail. It lives next to the normal one
    -- (which keeps working), so nobody can lock another person out just by
    -- asking for a recovery.
    temp_password_hash       VARCHAR(100),
    temp_password_expires_at TIMESTAMPTZ,
    -- TRUE after entering with the temporary password: until it is changed
    -- the documents are not shown.
    must_change_password     BOOLEAN      NOT NULL DEFAULT FALSE,
    last_login_at            TIMESTAMPTZ,
    created_at               TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at               TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT chk_accounts_identification CHECK (identification ~ '^([0-9]{10}|[0-9]{13})$'),
    CONSTRAINT chk_accounts_not_final_consumer CHECK (identification <> '9999999999999')
);

-- ---------------------------------------------------------------------
--  sessions: opaque token in an HttpOnly cookie; only its SHA-256 is kept,
--  so a copy of this table does not let anyone in. Logging out or changing
--  the password deletes the rows: the session really ends.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS portal.sessions (
    session_id    BIGSERIAL PRIMARY KEY,
    token_hash    CHAR(64)     NOT NULL UNIQUE,
    account_id    BIGINT       NOT NULL REFERENCES portal.accounts(account_id) ON DELETE CASCADE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    last_seen_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    expires_at    TIMESTAMPTZ  NOT NULL,
    ip_address    VARCHAR(45),
    user_agent    VARCHAR(300)
);
CREATE INDEX IF NOT EXISTS ix_sessions_account ON portal.sessions (account_id);
CREATE INDEX IF NOT EXISTS ix_sessions_expires ON portal.sessions (expires_at);

-- ---------------------------------------------------------------------
--  auth_attempts: every login and recovery attempt, successful or not.
--  The limits (per identification and per IP) are counted here, so they
--  survive a restart of the backend.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS portal.auth_attempts (
    attempt_id      BIGSERIAL PRIMARY KEY,
    kind            VARCHAR(10)  NOT NULL,
    identification  VARCHAR(13),
    ip_address      VARCHAR(45)  NOT NULL,
    success         BOOLEAN      NOT NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT chk_auth_attempts_kind CHECK (kind IN ('LOGIN', 'RECOVERY'))
);
CREATE INDEX IF NOT EXISTS ix_auth_attempts_identification ON portal.auth_attempts (identification, kind, created_at);
CREATE INDEX IF NOT EXISTS ix_auth_attempts_ip ON portal.auth_attempts (ip_address, kind, created_at);

-- ---------------------------------------------------------------------
--  download_log: who downloaded which document and when (support and
--  audit). The access key identifies the document inside its instance.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS portal.download_log (
    download_id     BIGSERIAL PRIMARY KEY,
    account_id      BIGINT       NOT NULL REFERENCES portal.accounts(account_id) ON DELETE CASCADE,
    instance_code   VARCHAR(30)  NOT NULL,
    document_type   VARCHAR(12)  NOT NULL,
    access_key      VARCHAR(49)  NOT NULL,
    file_format     VARCHAR(3)   NOT NULL,
    ip_address      VARCHAR(45),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT chk_download_log_type CHECK (document_type IN ('INVOICE', 'CREDIT_NOTE')),
    CONSTRAINT chk_download_log_format CHECK (file_format IN ('PDF', 'XML'))
);
CREATE INDEX IF NOT EXISTS ix_download_log_account ON portal.download_log (account_id, created_at DESC);
