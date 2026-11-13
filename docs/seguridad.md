# Seguridad del portal de descargas

Defensa por capas. Un ataque tiene que pasar todas, y cada capa funciona aunque falle la anterior.

## Qué ve quien intenta algo

| Situación | Código | Vista |
|---|---|---|
| Dirección que no existe (`/comprobantesx`, `/perfil/a/b`) | 404 | 404 |
| API abierto en la barra del navegador (`/api/documents`) | 404 | 404 |
| Archivo sensible o sondeo (`/.env`, `/.git`, `.php`, `wp-admin`, `phpmyadmin`, `actuator`…) | 403 | 403 |
| Ruta anidada o codificada (`../`, `%2e%2e`, `%2f`, `//`, `;`, NUL) | 403 | 403 |
| Inyección SQL (`union select`, `' or`, `; drop`, `pg_sleep`, `information_schema`) | 403 | 403 |
| XSS (`<script`, `<svg`, `onerror=`, `javascript:`) | 403 | 403 |
| Log4Shell (`${jndi:`), lectura de `/etc/passwd` | 403 | 403 |
| Escáneres (`sqlmap`, `nikto`, `nmap`, `nuclei`, `wpscan`…) | 403 | 403 |
| Método no permitido (`DELETE`, `TRACE`…) | 405 | 403 |
| Lo mismo pero desde la app (fetch) | 403 JSON `FORBIDDEN` | La app pasa a su vista 403 |

Las vistas 403 y 404 son siempre la misma pantalla de React. Las que sirve nginx (`403.html` y `404.html`) son copias de `index.html` con `<meta name="portal-error">`, generadas en el Dockerfile.

## Capas

1. **nginx del contenedor** (`frontend/nginx.conf`):
   - mapas `$bad_path`, `$attack` y `$bad_agent` sobre la línea cruda de la petición;
   - solo existen las rutas de la app;
   - límites de velocidad por IP, incluido uno especial para ingresar y recuperar;
   - cuerpos de 16 KB como máximo;
   - solo los métodos GET, HEAD, POST y PUT.
2. **Cabeceras** (`frontend/cabeceras-seguridad.conf`):
   - CSP estricta: scripts solo del sitio, sin código ni estilos en línea, sin frames;
   - **Trusted Types**: desde JavaScript no se puede convertir texto en HTML;
   - `frame-ancestors 'none'`, `nosniff`, COOP, COEP y CORP;
   - HSTS desde el nginx del host.
3. **Cortafuegos del backend** (`CortafuegosFilter.java`). Repite las reglas de nginx por si alguien llegara al backend sin pasar por él, y deja un aviso en el log de cada bloqueo.
4. **Inyección SQL imposible por construcción**:
   - todo valor del usuario viaja como parámetro (`?`) de JdbcTemplate;
   - la búsqueda ni siquiera llega al SQL: se filtra en Java;
   - los parámetros de ruta tienen formato fijo: clave de 49 dígitos, código de instancia `[a-z0-9-]`, tipo y formato cerrados.
5. **Base del ERP de solo lectura**:
   - el rol `portal_lectura` tiene SELECT solo en las columnas necesarias;
   - sus transacciones son de solo lectura y cada consulta se corta a los 10 s;
   - aunque hubiera una inyección, no podría escribir ni leer el certificado `.p12`.
6. **Sesión**: el portal no usa JWT, a propósito.
   - La sesión es un token aleatorio de 256 bits en una cookie `HttpOnly`, `Secure` y `SameSite=Strict`, con prefijo `__Host-` en producción.
   - La base guarda solo su SHA-256.
   - Vence tras 2 h sin uso o a las 12 h.
   - Se puede revocar de verdad: al salir o al cambiar la clave.
   - No hay firma que falsificar ni ataque de `alg: none`, y robar la base no permite entrar.
7. **CSRF**: además de SameSite=Strict, toda escritura exige la cabecera `X-Portal-Request`.
8. **Contraseñas**:
   - se guardan con bcrypt (costo 10);
   - 5 intentos fallidos bloquean la cuenta 15 minutos, y también hay tope por IP;
   - el tiempo de respuesta es el mismo exista o no la cuenta;
   - la clave temporal vence en 24 h y no reemplaza a la anterior.
9. **Datos**:
   - cada descarga vuelve a comprobar que el comprobante pertenece a la cédula o RUC de la sesión;
   - un comprobante ajeno responde igual que uno inexistente;
   - campos JSON desconocidos dan 400.
10. **Entradas**:
    - caracteres prohibidos bloqueados al escribir y rechazados en el backend;
    - topes de longitud en todos los campos.
