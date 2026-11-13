# Portal de descargas FluxoIA (`www.portal.flxia.net`)

Página pública donde los **clientes** de los negocios que usan FluxoERP entran con su **RUC o cédula** y descargan el **PDF (RIDE)** y el **XML autorizado** de sus facturas y notas de crédito.

Es un solo portal para todas las instancias del ERP: megamayorista, CCI, SmartDu, Shihay, iGoma, Anturios y las que se sumen. Las instancias se registran por configuración.

## Cómo funciona

- **Comprobantes:** el portal no los copia. Los lee en vivo, en solo lectura, de la base de cada instancia con el rol `portal_lectura`. Ese rol solo puede leer las columnas que hacen falta y sus transacciones son de solo lectura.
- **Base propia (`portal_flxia`):** guarda cuentas (contraseñas con bcrypt), sesiones, intentos y la bitácora de descargas.
- **Sin registro:**
  - La primera vez, el usuario y la contraseña son el RUC o la cédula.
  - La cuenta se crea solo si esa identificación tiene al menos un comprobante autorizado.
  - Nunca se acepta 9999999999999.
- **Recuperar contraseña:** si las facturas tienen correo, llega una clave temporal válida por 24 h. Si no tienen, la clave vuelve a ser el RUC o la cédula.
- **Descargas:** cada una vuelve a comprobar que el comprobante es de quien tiene la sesión, que está AUTORIZADO, que la orden está activa y que es del ambiente de producción.

## Estructura

| Carpeta | Qué hay |
|---|---|
| `backend/` | Spring Boot 3.5 · Java 21 · JdbcTemplate (`net.flxia.portal`) |
| `frontend/` | React 18 · Vite · Tailwind (modo claro y oscuro) · nginx |
| `docker/postgres/init_portal.sql` | Todo el SQL de la base del portal |
| `sql/preparar_erp_para_portal.sql` | Rol, permisos e índices que se agregan a cada base del ERP |
| `scripts/preparar_instancia.sh` | Prepara una instancia y escribe su bloque en `config/instancias.yml` |
| `config/instancias.ejemplo.yml` | Formato del registro de instancias |
| `docker/nginx-host/` | Sitio del nginx del servidor |
| `docs/` | Plan de arquitectura y guía de despliegue |

## Reglas del proyecto

- **Nombres:** los archivos van en español, y por eso las clases Java también. Todo lo demás va en inglés: tablas, columnas, rutas del API, variables y componentes React.
- **Caracteres prohibidos:**
  - Ningún campo deja escribir ni pegar `* / = ¿ ? ( ) \ & % $ # ! ¡ ° | ; :`, comillas, `¬`, `` ` `` ni `< >`.
  - El backend rechaza lo mismo.
  - Cada campo muestra su contador (`10 / 13`) y no deja pasar el tope.
  - Excepción: las contraseñas aceptan símbolos.
- **SQL:** todo vive en los init. No hay migraciones sueltas.
- **Commits:** sin firma de coautor.

## Local

1. Copiar `.env.ejemplo` a `.env`, con `PORTAL_COOKIE_SECURE=false` y `PORTAL_PUBLIC_URL=http://localhost:3035`.
2. Preparar las bases locales del ERP. Por ejemplo:

   ```bash
   INSTANCIAS_YML=config/instancias.yml scripts/preparar_instancia.sh ../erp_smartdu smartdu "SmartDu"
   ```

3. Levantar el portal:

   ```bash
   docker compose up -d --build
   ```

4. Abrir <http://localhost:3035>.

Para desarrollar el frontend con recarga en vivo: `cd frontend && npm install && npm run dev` (puerto 5173). Envía `/api` al portal en Docker.

## Producción

Ver [docs/despliegue-produccion.md](docs/despliegue-produccion.md).
