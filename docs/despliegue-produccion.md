# Despliegue de `www.portal.flxia.net` en producción

Servidor: `ssh -p 49222 root@2.24.111.98`. Todo se corre **dentro de tmux**: `tmux new -s portal`, o `tmux attach -t portal` si ya existe.

**Qué cambia en las bases del ERP:**
- Un rol nuevo de solo lectura, `portal_lectura`.
- Permisos por columna para ese rol.
- Dos índices por identificación del cliente.

No se toca ningún dato. Los índices se crean con `CONCURRENTLY`, así que no bloquean las ventas.

Comprobado el 13-nov-2026: desde la red Docker de una instancia se llega al Postgres de otra por su puerto publicado. Eso es lo que usa el portal (`host.docker.internal:<DB_PORT>`).

---

## 0. Versionar y subir (en la PC de Cristian)

Es la primera vez, así que se crea el repo y se sube a GitHub. `.env` y `config/instancias.yml` NO se suben (están en `.gitignore`).

```bash
cd "C:/Users/Cristian Oviedo/Downloads/portalFlxiaERP" && git init -b main && git add -A && git update-index --chmod=+x scripts/preparar_instancia.sh docker/postgres/02-usuario-app.sh && git status --short
```

En esa lista NO pueden aparecer `.env` ni `config/instancias.yml`. Si aparecen, no se sigue.

```bash
cd "C:/Users/Cristian Oviedo/Downloads/portalFlxiaERP" && git commit -m "feat: portal de descargas de comprobantes electronicos (portal.flxia.net)" && git remote add origin https://github.com/megaMayorista/portalFlxiaERP.git && git push -u origin main
```

## 1. DNS en Cloudflare

| Tipo | Nombre | Valor | Proxy |
|---|---|---|---|
| A | `portal` | `2.24.111.98` | DNS only (ya creado) |
| A | `www.portal` | `2.24.111.98` | **DNS only** (falta) |

Hace falta `www.portal` porque el RIDE imprime `www.portal.flxia.net`. Los dos registros van en gris ("DNS only"): el certificado lo emite certbot en el servidor, y el proxy naranja de Cloudflare no cubre subdominios de segundo nivel como `www.portal` con su certificado gratuito.

Se comprueba en el servidor con `getent hosts portal.flxia.net www.portal.flxia.net`.

## 2. Llave de despliegue (deploy key) en el servidor

Misma convención que las demás: archivo `~/.ssh/portal_deploy_key` y alias `github-portal`.

```bash
ssh-keygen -t ed25519 -N "" -C "portalFlxiaERP@srv1899833" -f ~/.ssh/portal_deploy_key && printf '\nHost github-portal\n  HostName github.com\n  User git\n  IdentityFile ~/.ssh/portal_deploy_key\n  IdentitiesOnly yes\n' >> ~/.ssh/config && cat ~/.ssh/portal_deploy_key.pub
```

La última línea que imprime (`ssh-ed25519 AAAA… portalFlxiaERP@srv1899833`) se pega en GitHub:
1. Ir a <https://github.com/megaMayorista/portalFlxiaERP/settings/keys/new>.
2. Title: `srv1899833 produccion`.
3. Key: la línea copiada.
4. Dejar **sin marcar** "Allow write access", porque el servidor solo baja código.
5. **Add key**.

Para probarla:

```bash
ssh -T git@github-portal
```

Tiene que decir `Hi megaMayorista/portalFlxiaERP! You've successfully authenticated…`.

## 3. Código y `.env`

```bash
cd /opt && git clone git@github-portal:megaMayorista/portalFlxiaERP.git && cd /opt/portalFlxiaERP && cp .env.ejemplo .env && sed -i "s/^DB_PASSWORD=.*/DB_PASSWORD=$(openssl rand -hex 24)/; s/^APP_DB_PASSWORD=.*/APP_DB_PASSWORD=$(openssl rand -hex 24)/" .env && chmod 600 .env
```

```bash
nano /opt/portalFlxiaERP/.env
```

Ahí se completa `PORTAL_MAIL_PASSWORD=` con la contraseña de aplicación de Gmail de `fluxoiaec@gmail.com`: 16 letras, sin espacios. Los demás valores ya vienen listos para producción (`PORTAL_COOKIE_SECURE=true`, `FRONTEND_BIND=127.0.0.1`, `FRONTEND_PORT=3035`, soporte `096 060 8410`).

## 4. Preparar cada base del ERP y armar `config/instancias.yml`

Cada línea:
1. Crea los índices.
2. Crea el rol `portal_lectura` con una clave nueva.
3. Comprueba que el rol puede leer y que NO puede escribir.
4. Escribe su bloque directo en `config/instancias.yml`, así la clave nunca se muestra en pantalla.

```bash
cd /opt/portalFlxiaERP && touch config/instancias.yml && chmod 600 config/instancias.yml && chown 10001:10001 config/instancias.yml
```

```bash
cd /opt/portalFlxiaERP && export INSTANCIAS_YML=config/instancias.yml && bash scripts/preparar_instancia.sh /opt/erp_megamayorista megamayorista "Mega Mayorista" && bash scripts/preparar_instancia.sh /opt/erp_cci cci "CCI" && bash scripts/preparar_instancia.sh /opt/erp_smartdu smartdu "SmartDu" && bash scripts/preparar_instancia.sh /opt/erp_shihay shihay "Shihay" && bash scripts/preparar_instancia.sh /opt/erp_igoma igoma "iGoma" && bash scripts/preparar_instancia.sh /opt/erp_anturios anturios "Anturios"
```

Cada instancia tiene que terminar en `Lectura OK, escritura bloqueada.` y `Listo.` Si una falla, la cadena se detiene ahí y dice por qué. Las instancias ya preparadas quedan bien, y volver a correr una es seguro: rota su clave y reemplaza su bloque.

El archivo queda con permisos `600` y dueño `10001`, que es el usuario del contenedor del backend. Así solo lo lee el portal.

Para revisarlo sin mostrar las claves:

```bash
sed -E 's/(password: ).*/\1"***"/' /opt/portalFlxiaERP/config/instancias.yml
```

## 5. Levantar el portal

La salida se ve en vivo:

```bash
cd /opt/portalFlxiaERP && docker compose up -d --build 2>&1 | tail -20; echo "salida=${PIPESTATUS[0]}"
```

```bash
cd /opt/portalFlxiaERP && docker compose ps && docker logs portal_backend 2>&1 | grep -E "ERP instance|Started|ERROR" | tail -12 && curl -s http://127.0.0.1:3035/api/public/health; echo
```

Tiene que haber seis líneas `ERP instance registered`, una `Started AplicacionPortal` y la respuesta `{"status":"UP"}`.

## 6. nginx del host y certificado

```bash
cp /opt/portalFlxiaERP/docker/nginx-host/portal.flxia.net.conf /etc/nginx/sites-available/portal.flxia.net && ln -sf /etc/nginx/sites-available/portal.flxia.net /etc/nginx/sites-enabled/portal.flxia.net && nginx -t && systemctl reload nginx
```

```bash
certbot --nginx -d www.portal.flxia.net -d portal.flxia.net --redirect
```

```bash
curl -s https://www.portal.flxia.net/api/public/health; echo
```

## 7. Prueba funcional (Cristian)

1. Abrir `https://www.portal.flxia.net`.
2. Entrar con un RUC o cédula de un cliente real; la contraseña es la misma identificación.
3. Ver el listado, y probar la búsqueda, el filtro por tipo y la paginación.
4. Descargar un PDF y un XML.
5. En Perfil: cambiar el nombre y la contraseña.
6. Recuperar la contraseña con un cliente que tenga correo (llega una clave temporal) y con uno que no lo tenga (la clave vuelve a ser la cédula).
7. Probar el modo oscuro y la vista en el celular.

---

## Operación

### Actualizar el portal

En la PC: commit y `git push`. En el servidor:

```bash
cd /opt/portalFlxiaERP && git pull && docker compose up -d --build backend frontend 2>&1 | tail -20; echo "salida=${PIPESTATUS[0]}"
```

### Sumar una instancia nueva

Se corre su línea del paso 4 (con `INSTANCIAS_YML` exportado) y después `docker compose restart backend`. No se toca código.

### Sacar una instancia sin borrarla

En su bloque de `config/instancias.yml` se pone `enabled: false` y se reinicia el backend.

### Probar el correo (SMTP) sin tocar a ningún cliente

Envía el correo de la contraseña temporal, con una clave de ejemplo y el aviso "Correo de prueba", a la dirección que se indique. Corre en un contenedor aparte que se borra solo, así que el portal sigue atendiendo:

```bash
cd /opt/portalFlxiaERP && docker compose run --rm --no-deps backend --spring.main.web-application-type=none --enviar-correo-prueba=SU_CORREO@gmail.com 2>&1 | grep -E "CORREO|ERROR"
```

Si sale bien, la última línea dice `CORREO DE PRUEBA ENVIADO`. Si no, dice `EL CORREO DE PRUEBA NO SALIÓ` con la causa; lo más común es una clave de aplicación mal copiada.

### Cambiar la clave de Gmail

Se edita `.env` y se recrea el backend. Con `restart` no basta: el `.env` se lee al crear el contenedor.

```bash
cd /opt/portalFlxiaERP && docker compose up -d backend
```

### Ver descargas por día

```bash
docker exec -it portal_postgres psql -U portal_admin -d portal_flxia -c "SELECT date_trunc('day', created_at) AS dia, count(*) FROM portal.download_log GROUP BY 1 ORDER BY 1 DESC LIMIT 14;"
```

### Desbloquear un usuario antes de los 15 minutos

Reemplazar la cédula de ejemplo:

```bash
docker exec -it portal_postgres psql -U portal_admin -d portal_flxia -c "DELETE FROM portal.auth_attempts WHERE identification = '1712345678' AND success = 0;"
```

### Volver atrás

`docker compose down` en `/opt/portalFlxiaERP` apaga el portal sin afectar ninguna instancia del ERP.

Para quitar también el acceso a una base del ERP:

```bash
docker exec -i erp_postgres psql -U erp_admin -d erp_megamayorista -c "ALTER ROLE portal_lectura NOLOGIN;"
```
