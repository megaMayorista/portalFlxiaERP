# Portal de descargas — plan de arquitectura

`www.portal.flxia.net` · 12-nov-2026 · estado: **construido y corriendo en local desde el 13-nov** (puerto 3035, base en 5465). Falta la prueba de Cristian y el despliegue: ver [despliegue-produccion.md](despliegue-produccion.md).

Datos confirmados por Cristian el 13-nov:
- Soporte: 096 060 8410 (también por WhatsApp).
- SMTP: fluxoiaec@gmail.com, con contraseña de aplicación.
- Sin redes sociales en el login.
- Colores e ilustraciones de flxia.net: las tres ilustraciones del carrusel están dibujadas en código en `frontend/src/componentes/Ilustraciones.jsx`.

Puertos: 3035 y 5465. Los primeros que había elegido (3030, 8130 y 5460) los ocupa otro proyecto en la PC de Cristian.

## Reglas fijas del proyecto

1. **Expresiones regulares y límite de caracteres en TODOS los campos.** Son tres cosas juntas, como en el resto de proyectos:
   - En el frontend el caracter no se puede escribir ni pegar: `* / = ¿ ? ( ) \ & % $ # ! ¡ ° | ; :`, comillas, `¬`, `` ` ``, `< >`.
   - El backend rechaza lo mismo con un 400 y un mensaje claro; en el buscador, en cambio, solo los quita.
   - Cada campo tiene un contador visible `10 / 13` y al llegar al tope no deja escribir más. El tope lo aplica el filtro, no `maxLength`, que recortaría lo pegado antes de limpiarlo.

   | Campo | Acepta | Tope |
   |---|---|---|
   | Usuario / identificación (ingreso y recuperar) | solo dígitos | 13 |
   | Buscador (número, clave o emisor) | texto sin los símbolos | 60 |
   | Fechas desde / hasta | selector de fecha (el backend exige `AAAA-MM-DD`) | — |
   | Nombre completo (perfil) | texto sin los símbolos | 200 |
   | Contraseñas | **excepción:** acepta símbolos, porque hacen la clave más fuerte y nunca llegan a un documento, a un XML ni a una consulta (se guardan como hash). Solo se bloquean los caracteres de control y los espacios | 64 (mínimo 8) |

   El nombre que se copia de la última factura al crear la cuenta pasa por la misma limpieza: por ejemplo, `A & B S.A.` queda como `A B S.A.`.
2. **Commits sin firma de coautor:** ningún `Co-Authored-By`, ni en los commits ni en las PR. No se commitea ni se pushea hasta que Cristian lo pida.
3. **Nombres:** los archivos van en español, incluidas las clases Java. El código y la base de datos van en inglés.

## Decisiones (12-nov, se aplicaron las recomendaciones)

- Frontend con Vite en vez de create-react-app. El resto sigue igual (React 18 + Tailwind).
- Cédula y RUC son cuentas separadas.
- En el primer ingreso no se obliga a cambiar la clave, pero se muestra un aviso permanente mientras siga siendo la cédula. Con la clave temporal del correo sí se obliga.
- Los pasaportes quedan fuera de la primera versión.
- Todavía configurables mientras Cristian no los mande: logo e ilustraciones (se usa la "F" de `web_fluxoAI` mientras tanto), número de soporte (096 060 8410 por ahora), cuenta SMTP y redes.

## Qué sabemos de los datos (consultas de solo lectura, 12-nov)

| Instancia | Facturas autorizadas (ambiente 2) | Clientes distintos |
|---|---|---|
| megamayorista | 26.088 (PDF y XML en todas menos 3) | 9.471 (87 % con correo) |
| smartdu | 83 | 80 |
| igoma | 3 | 1 |
| cci · shihay · anturios | 0 (hoy no facturan electrónicamente) | — |

- El cliente con más facturas tiene 111. Juntar los resultados de todas las instancias en memoria no pesa nada.
- PDF promedio de 40 KB y XML de 10 KB. El XML guardado ya es el sobre `<autorizacion>` del SRI, así que se sirve tal cual.
- No hay identificaciones con espacios y ninguna orden tiene dos comprobantes AUTORIZADOS.
- Notas de crédito de venta (`conta_credito`): ninguna autorizada en ninguna instancia todavía, pero quedan soportadas.
- Los Postgres de todas las instancias publican su puerto en el host (5433, 5436, 5443, 5445-5447).
- Puertos libres en el servidor: 3030 y 8130.

## Arquitectura

```
navegador ──HTTPS──► nginx del host (portal.flxia.net, certbot)
                        └─► 127.0.0.1:3030  portal_frontend (nginx: SPA + proxy /api)
                                               └─► portal_backend:8080 (red interna, sin puerto publicado)
                                                     ├─► portal_postgres (cuentas, sesiones, intentos, bitácora)
                                                     └─► Postgres de cada instancia ERP, rol portal_lectura (solo SELECT)
```

- **Repo `portalFlxiaERP`**: `backend/` (Spring Boot 3, Java 21, JdbcTemplate sin JPA), `frontend/` (React 18 + Tailwind), `docker/postgres/init_portal.sql` (todo el SQL del portal), `sql/preparar_erp_para_portal.sql` (rol e índices del lado del ERP), `scripts/` (despliegue y alta de instancias) y `config/instancias.ejemplo.yml`.
- **Nombres**: la misma regla que en AirStore. Los archivos van en español, y por eso las clases Java también (en Java el archivo es la clase). Todo lo demás va en inglés: tablas, columnas, rutas del API, variables y los componentes React exportados.
- **Registro de instancias por configuración**: el archivo `config/instancias.yml` vive en el servidor, fuera de git y con permisos 600. Lleva una entrada por instancia con `code`, `name`, `jdbc-url`, usuario, clave y `environments: [2]`. Sumar una instancia es agregar la entrada y reiniciar el backend (unos 10 s), sin tocar código. El backend llega a cada base por `host.docker.internal:<DB_PORT>`.
- **Lectura en vivo, sin copiar nada**: cada consulta va en paralelo a todas las instancias con un tiempo límite de 5 s. Si una instancia no responde, el listado muestra las demás y avisa que pueden faltar comprobantes.
- **Rol `portal_lectura` en cada base del ERP**: tiene SELECT solo sobre las COLUMNAS necesarias (por ejemplo, de `pos_configuracion` solo RUC y razón social; nunca el certificado .p12). Además lleva `default_transaction_read_only=on` y `statement_timeout=10s`. Se agregan los índices `pos_ordenes(ord_cliente_identificacion)` y `conta_credito(ccr_cliente_identificacion)`, con CONCURRENTLY en producción.

## Reglas de negocio y seguridad

- **Qué se muestra**: facturas `ord_mascara='FACTURA'`, `ord_activo=1`, `cse_estado='AUTORIZADO'` y el ambiente de la instancia (2 en producción). Notas de crédito: `ccr_estado_sri='AUTORIZADO'`, `ccr_activo=1` y `ccr_eliminada=0`.
- **Ingreso**: se valida la cédula (dígito verificador) o el RUC (13 dígitos, provincia, tercer dígito y sufijo 001). Nunca se acepta 9999999999999.
  - Primera vez: si la contraseña es igual a la identificación y esa identificación tiene al menos un comprobante, se crea la cuenta con el nombre de su última factura.
  - Contraseñas con bcrypt.
- **Recuperar**:
  - Si hay correo, se usa el de su última factura y se muestra enmascarado, `cr****@gmail.com`. Se envía una clave temporal que vence en 24 h. La clave anterior sigue sirviendo hasta que se use la temporal, así nadie bloquea a otro pidiendo recuperaciones. Al entrar con la temporal se obliga a cambiarla.
  - Si no hay correo, la clave vuelve a ser la identificación, como se pidió. Hay que saber que cualquiera que conozca esa cédula puede hacerlo; es el mismo riesgo que el primer ingreso.
- **Límites**:
  - Ingreso: 5 fallos en 15 min por identificación bloquean 15 min, y 20 fallos por IP en 15 min dan 429.
  - Recuperar: 3 por hora por identificación y 10 por IP.
  - Los intentos se guardan en la base, así que sobreviven reinicios.
- **Sesión**:
  - Token opaco guardado como hash en `sessions` y enviado en una cookie HttpOnly, Secure y SameSite=Strict.
  - Vence tras 2 h de inactividad y a las 12 h como máximo.
  - Cerrar sesión o cambiar la clave invalida la sesión de verdad.
  - Toda escritura exige la cabecera `X-Portal-Request`, que bloquea el CSRF.
- **Descargas**: `/api/documents/{instancia}/{tipo}/{claveAcceso}/pdf|xml`.
  - Cada descarga vuelve a consultar la base y exige clave, identificación de la sesión, AUTORIZADO, activo y ambiente.
  - No hay IDs secuenciales.
  - La respuesta va con `no-store` y queda anotada en `download_log`.
- **Cabeceras**: CSP estricta, `frame-ancestors 'none'` y HSTS en el host. El backend y la base no tienen puertos publicados, y el frontend solo escucha en 127.0.0.1.

## Pantallas

1. **Ingreso**:
   - Panel izquierdo con un carrusel de ilustraciones y el texto fijo.
   - Panel derecho con logo, usuario, contraseña, "¿Olvidó su contraseña?", redes y copyright.
   - En celular solo se ve el formulario.
2. **Recuperar contraseña**: con el número de soporte visible.
3. **Mis comprobantes**:
   - Cada fila muestra tipo y número, emisor (RUC – razón social), fecha, clave de acceso, total y los botones PDF/XML.
   - Buscador de texto (número, clave o emisor) y rango de fechas.
   - Filtro Todos / Factura / Nota de crédito.
   - Paginación con el total de documentos.
4. **Perfil**: nombre editable y cambio de contraseña.
   - Mínimo 8 caracteres, distinta de la identificación.
   - Mientras la clave siga siendo la cédula, se muestra un aviso "cámbiela".
5. **Modo oscuro**: se recuerda en el navegador.

## Despliegue (`/opt/portalFlxiaERP`)

1. Preparar las bases del ERP:
   - Cristian corre `scripts/preparar_instancia.sh /opt/erp_<x>` en cada instancia.
   - El script crea el rol con una clave aleatoria, los índices CONCURRENTLY y los GRANT.
   - Al final imprime la entrada lista para `instancias.yml`.
2. Levantar el portal:
   - `git clone`, `.env` (SMTP y clave de la base del portal), `config/instancias.yml`.
   - Después `docker compose up -d --build`.
3. Publicar el sitio:
   - DNS: registros A de `portal` y `www.portal` hacia 2.24.111.98.
   - Sitio de nginx en el host y `certbot --nginx -d portal.flxia.net -d www.portal.flxia.net`.
4. Del lado del ERP, en otra sesión: el rol y los índices van al `init_erp.sql` de cada repo, y el enlace al portal va al correo de la factura.

## Local

`docker compose up -d --build` en `portalFlxiaERP`. Lee la base local de megamayorista (5433) y la de SmartDu (5445); la de SmartDu tiene 4 facturas autorizadas de ambiente 2. En local los dos Postgres reciben el rol y los índices, sin tocar ningún dato.
