FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --no-audit --no-fund
COPY . .
# 403.html y 404.html son la MISMA app con una marca: así las vistas de error
# que sirve nginx (ataques bloqueados, sondeos, API abierto en el navegador)
# se ven idénticas a las de React. La app lee <meta name="portal-error">.
RUN npm run build \
 && for code in 403 404; do \
      sed "s#<head>#<head><meta name=\"portal-error\" content=\"$code\" />#" dist/index.html > "dist/$code.html"; \
      grep -q "portal-error\" content=\"$code\"" "dist/$code.html"; \
    done

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY cabeceras-seguridad.conf /etc/nginx/snippets/cabeceras-seguridad.conf
COPY proxy-api.conf /etc/nginx/snippets/proxy-api.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
